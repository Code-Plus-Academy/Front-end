import { redirect } from 'next/navigation';

export default async function ArticelByPage({ searchParams }) {
  const params = await searchParams;
  const username = params?.user || params?.username;

  if (username) {
    redirect(`/u/${username}`);
  }

  redirect('/notes');
}
