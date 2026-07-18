-- Blog Media Management Support
-- BlogPost already has "coverImage" (the featured image, since the initial
-- schema). This adds the two still-missing media fields: a separate
-- thumbnail image and alt text. No new tables — media is still just a URL
-- string, the same convention already used by coverImage, Company.logo,
-- and SEOMetadata.ogImage. The existing Media Library (MediaFile/MediaFolder)
-- is untouched; posts keep referencing media by URL, not by a foreign key
-- into it, consistent with how every other content type in this schema does.

ALTER TABLE "BlogPost" ADD COLUMN "thumbnailImage" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "imageAlt" TEXT;
