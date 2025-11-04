import Link from "next/link";

export default async function PostDetailPage({
  params,
}: PageProps<"/posts/[id]">) {
  const { id } = await params;

  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
    cache: "no-store",
  });

  const post = await res.json();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{post.title}</h1>
      <p className="text-gray-600">{post.body}</p>
      <Link href="/" className="text-blue-500 underline">
        ← Back to list
      </Link>
    </div>
  );
}
