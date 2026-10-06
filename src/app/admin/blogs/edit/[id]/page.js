import { redirect } from "next/navigation";

export default async function EditBlogParamPage({ params }) {
  const resolved = await params;
  const { id } = resolved;
  redirect(`/admin/blogs/editor?id=${id}`);
}
