import { prisma } from '@/lib/prisma';

export type BlogApprovalAction = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export async function logApprovalAction(
  postId: string,
  action: BlogApprovalAction,
  actorId?: string,
  notes?: string
) {
  return prisma.blogPostApproval.create({
    data: { postId, action, actorId, notes },
  });
}

/** Full approval history for a post, oldest first (a readable timeline, not a reverse feed). */
export async function getApprovalHistory(postId: string) {
  return prisma.blogPostApproval.findMany({
    where: { postId },
    include: { actor: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });
}
