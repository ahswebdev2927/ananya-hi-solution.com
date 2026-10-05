import SingleBlogDetailPage, { generateMetadata as baseGenerateMetadata } from "../../blogs/[slug]/page";

export async function generateMetadata(props) {
  return baseGenerateMetadata(props);
}

export default async function BlogSlugLegacyPage(props) {
  return <SingleBlogDetailPage {...props} />;
}
