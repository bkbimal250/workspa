ALTER TABLE areas
ADD CONSTRAINT uq_areas_city_id_name UNIQUE (city_id, name);
