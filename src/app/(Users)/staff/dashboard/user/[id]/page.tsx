interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function userDetails(props: PageProps) {
  const params = await props.params;
  return <h1>User Id: {params.id}</h1>;
}
