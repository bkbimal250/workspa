import { ChangeEvent } from 'react';
import { Location } from '@/lib/spa';

export type SpaCreateStep = 1 | 2 | 3;

export type SpaFormData = {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  directions: string;
  opening_hours: string;
  closing_hours: string;
  booking_url_website: string;
  country_id: string;
  state_id: string;
  city_id: string;
  area_id: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  rating: string;
  reviews: string;
  is_active?: boolean;
  is_verified?: boolean;
};

export type SpaFieldChangeHandler = (
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => void;

export type LocationOptions = {
  countries: Location[];
  states: Location[];
  cities: Location[];
  areas: Location[];
};
