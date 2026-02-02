import CityClient from './CityClient';

export default function Page({ params }: { params: { city: string } }) {
  return <CityClient params={params} />;
}
