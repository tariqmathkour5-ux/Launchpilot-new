import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const tab = searchParams.get("tab") || "executive";
  const startDate = searchParams.get("startDate")
    ? new Date(searchParams.get("startDate")!)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = searchParams.get("endDate")
    ? new Date(searchParams.get("endDate")!)
    : new Date();

  let data: Record<string, unknown>[] = [];
  let headers: string[] = [];
  let filename = `analytics-${tab}-${new Date().toISOString().split("T")[0]}`;

  switch (tab) {
    case "traffic": {
      const visits = await prisma.$queryRaw`
        SELECT
          DATE(visited_at) as date,
          path,
          referrer,
          country,
          bounced,
          duration
        FROM "WebsiteVisit"
        WHERE visited_at >= ${startDate} AND visited_at <= ${endDate}
        ORDER BY visited_at DESC
        LIMIT 1000
      `;
      data = (visits as Record<string, unknown>[]).map((v) => ({
        ...v,
        bounced: v.bounced ? "Yes" : "No",
      }));
      headers = ["date", "path", "referrer", "country", "bounced", "duration"];
      filename = `traffic-analytics-${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "search": {
      const searches = await prisma.$queryRaw`
        SELECT
          query,
          category,
          results_count,
          clicked_tool_id,
          device,
          source,
          created_at
        FROM search_analytics
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        ORDER BY created_at DESC
        LIMIT 1000
      `;
      data = searches as Record<string, unknown>[];
      headers = ["query", "category", "results_count", "clicked_tool_id", "device", "source", "created_at"];
      filename = `search-analytics-${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "affiliate": {
      const clicks = await prisma.$queryRaw`
        SELECT
          ac."toolId" as tool_id,
          t.name as tool_name,
          ac.source,
          ac.medium,
          ac.campaign,
          ac.clicked_at
        FROM "AffiliateClick" ac
        LEFT JOIN "Tool" t ON ac."toolId" = t.id
        WHERE ac.clicked_at >= ${startDate} AND ac.clicked_at <= ${endDate}
        ORDER BY ac.clicked_at DESC
        LIMIT 1000
      `;
      data = clicks as Record<string, unknown>[];
      headers = ["tool_id", "tool_name", "source", "medium", "campaign", "clicked_at"];
      filename = `affiliate-analytics-${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "revenue": {
      const transactions = await prisma.revenueTransaction.findMany({
        where: {
          transactionDate: { gte: startDate, lte: endDate },
        },
        orderBy: { transactionDate: "desc" },
        take: 1000,
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          description: true,
          transactionDate: true,
          tool: { select: { name: true } },
          company: { select: { name: true } },
        },
      });
      data = transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        description: t.description || "",
        transaction_date: t.transactionDate.toISOString(),
        tool_name: t.tool?.name || "",
        company_name: t.company?.name || "",
      }));
      headers = ["id", "type", "amount", "currency", "status", "description", "transaction_date", "tool_name", "company_name"];
      filename = `revenue-analytics-${new Date().toISOString().split("T")[0]}`;
      break;
    }

    case "tools": {
      const tools = await prisma.$queryRaw`
        SELECT
          t.id, t.name, t.slug,
          COUNT(DISTINCT tv.id) as views,
          COUNT(DISTINCT ac.id) as clicks,
          COALESCE(AVG(ur.rating), 0) as avg_rating,
          COUNT(DISTINCT ur.id) as review_count
        FROM "Tool" t
        LEFT JOIN tool_view tv ON t.id = tv.tool_id AND tv.created_at >= ${startDate}
        LEFT JOIN "AffiliateClick" ac ON t.id = ac."toolId" AND ac.clicked_at >= ${startDate}
        LEFT JOIN "UserReview" ur ON t.id = ur."toolId"
        GROUP BY t.id, t.name, t.slug
        ORDER BY views DESC
        LIMIT 500
      `;
      data = (tools as Record<string, unknown>[]).map((t) => ({
        ...t,
        views: Number(t.views || 0),
        clicks: Number(t.clicks || 0),
        avg_rating: Number(t.avg_rating || 0).toFixed(2),
        review_count: Number(t.review_count || 0),
        ctr: Number(t.views || 0) > 0 ? ((Number(t.clicks || 0) / Number(t.views || 0)) * 100).toFixed(2) : "0",
      }));
      headers = ["id", "name", "slug", "views", "clicks", "ctr", "avg_rating", "review_count"];
      filename = `tools-analytics-${new Date().toISOString().split("T")[0]}`;
      break;
    }

    default: {
      const stats = await prisma.$queryRaw`
        SELECT
          DATE(visited_at) as date,
          COUNT(*) as visitors,
          COUNT(DISTINCT session_id) as unique_visitors
        FROM "WebsiteVisit"
        WHERE visited_at >= ${startDate} AND visited_at <= ${endDate}
        GROUP BY DATE(visited_at)
        ORDER BY date DESC
      `;
      data = (stats as Record<string, unknown>[]).map((s) => ({
        date: s.date,
        visitors: Number(s.visitors || 0),
        unique_visitors: Number(s.unique_visitors || 0),
      }));
      headers = ["date", "visitors", "unique_visitors"];
      filename = `executive-analytics-${new Date().toISOString().split("T")[0]}`;
    }
  }

  if (format === "csv") {
    const csvContent = generateCSV(data, headers);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  if (format === "excel") {
    const csvContent = generateCSV(data, headers);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="${filename}.xls"`,
      },
    });
  }

  if (format === "pdf") {
    const htmlContent = generatePDF(data, headers, tab, startDate, endDate);
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="${filename}.html"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid format" }, { status: 400 });
}

function generateCSV(data: Record<string, unknown>[], headers: string[]): string {
  const headerRow = headers.map((h) => h.replace(/_/g, " ").toUpperCase()).join(",");
  const dataRows = data.map((row) =>
    headers
      .map((h) => {
        const value = row[h];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(",")
  );
  return [headerRow, ...dataRows].join("\n");
}

function generatePDF(
  data: Record<string, unknown>[],
  headers: string[],
  tab: string,
  startDate: Date,
  endDate: Date
): string {
  const title = `LaunchPilot Analytics: ${tab.charAt(0).toUpperCase() + tab.slice(1)}`;

  let tableRows = "";
  data.slice(0, 100).forEach((row) => {
    tableRows += "<tr>";
    headers.forEach((h) => {
      const value = row[h];
      tableRows += `<td style="border: 1px solid #ddd; padding: 8px;">${value ?? ""}</td>`;
    });
    tableRows += "</tr>";
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .meta { color: #666; margin-bottom: 20px; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th { background: #f5f5f5; border: 1px solid #ddd; padding: 8px; text-align: left; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    <p>Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Total Records: ${data.length}</p>
  </div>
  <table>
    <thead>
      <tr>
        ${headers.map((h) => `<th>${h.replace(/_/g, " ")}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>
  `;
}
