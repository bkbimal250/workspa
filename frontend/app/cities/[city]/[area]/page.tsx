import AreaClient from './AreaClient';

export default function Page({ params }: { params: { city: string; area: string } }) {
  return <AreaClient params={params} />;
}
