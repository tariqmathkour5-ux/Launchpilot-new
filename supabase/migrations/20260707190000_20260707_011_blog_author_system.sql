-- Blog Author System
-- Adds User.bio — the only missing piece of an "author profile" for blog
-- purposes. Name and avatar already exist (User.name, User.image), and the
-- BlogPost <-> User authorship relationship already exists (BlogPost.authorId,
-- User.blogPosts) since the initial schema — nothing to add for either.

ALTER TABLE "User" ADD COLUMN "bio" TEXT;
