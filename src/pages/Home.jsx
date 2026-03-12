import {
  Hero,
  FeaturedPosts,
  BlogFeed,
  SuggestedReading,
  NewsletterBlock,
} from "../components/blog";

export const Home = () => {
  return (
    <main className="se-blog" role="main">
      <Hero />
      <FeaturedPosts />
      <BlogFeed />
      <SuggestedReading />
      <NewsletterBlock />
    </main>
  );
};
