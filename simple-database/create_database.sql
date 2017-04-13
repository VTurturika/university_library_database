
CREATE DATABASE university_library;
\c university_library;

CREATE TABLE IF NOT EXISTS reader (

  reader_id SERIAL PRIMARY KEY,
  last_name VARCHAR(25) NOT NULL,
  first_name VARCHAR(25) NOT NULL,
  middle_name VARCHAR(25) NOT NULL,
  gender VARCHAR(1) NOT NULL,
  priority SMALLINT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(50),
  is_active bool NOT NULL DEFAULT true,
  kind VARCHAR(50) NOT NULL,
  address_country VARCHAR(45),
  address_state VARCHAR(45),
  address_city VARCHAR(45),
  address_street VARCHAR(45),
  address_house VARCHAR(45),
  address_flat VARCHAR(45),
  address_zipcode VARCHAR(45)

);


CREATE TABLE IF NOT EXISTS student (

  student_id SERIAL PRIMARY KEY,
  faculty VARCHAR(100) NOT NULL,
  group_number VARCHAR(10) NOT NULL,
  speciality_code VARCHAR(30) NOT NULL,
  speciality_title VARCHAR(100) NOT NULL,
  course SMALLINT NOT NULL,
  start_date DATE NOT NULL,
  graduation_date DATE NOT NULL,
  education_form VARCHAR(20) NOT NULL,
  education_type VARCHAR(20) NOT NULL

) INHERITS (reader);


CREATE TABLE IF NOT EXISTS teacher (

  teacher_id SERIAL PRIMARY KEY,
  faculty VARCHAR(100) NOT NULL ,
  departument VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  degree VARCHAR(100),
  rank VARCHAR(50)

) INHERITS (reader);


CREATE TABLE IF NOT EXISTS postgraduate (

  postgraduate_id SERIAL PRIMARY KEY,
  speciality_code VARCHAR(30) NOT NULL,
  speciality_title VARCHAR(100) NOT NULL,
  faculty VARCHAR(100),
  education_type VARCHAR(45) NOT NULL,
  is_break_work BOOLEAN,
  start_date DATE NOT NULL,
  graduation_date DATE NOT NULL

) INHERITS (reader);


CREATE TABLE IF NOT EXISTS preparatory (

  preparatory_id SERIAL PRIMARY KEY,
  education_form VARCHAR(20) NOT NULL,
  start_studying DATE NOT NULL,
  end_studying DATE NOT NULL

) INHERITS (reader);


CREATE TABLE IF NOT EXISTS applicant (

  applicant_id SERIAL PRIMARY KEY,
  education_level VARCHAR(20) NOT NULL,
  speciality_code VARCHAR(30) NOT NULL,
  speciality_title VARCHAR(100) NOT NULL,
  entry_year SMALLINT NOT NULL

) INHERITS (reader);


CREATE TABLE IF NOT EXISTS certification_training (

  ct_id SERIAL PRIMARY KEY,
  start_training DATE NOT NULL,
  end_training DATE NOT NULL,
  faculty VARCHAR(100),
  departument VARCHAR(100) NOT NULL,
  speciality_code VARCHAR(30) NOT NULL,
  speciality_title VARCHAR(100) NOT NULL

) INHERITS (reader);


CREATE TABLE IF NOT EXISTS book (

  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  city VARCHAR(50),
  publisher VARCHAR(100),
  year SMALLINT,
  subject varchar(100),
  genre VARCHAR(100),
  periodic_release INT,
  page_count INT,
  lang varchar(10),
  days_keep_count INT NOT NULL,
  adding_date DATE NOT NULL,
  count INT NOT NULL,
  openlibrary_id VARCHAR(100) NOT NULL

);


CREATE TABLE IF NOT EXISTS author (

  id SERIAL PRIMARY KEY,
  last_name VARCHAR(100) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  openlibrary_id VARCHAR(100)

);


CREATE TABLE IF NOT EXISTS book_author (

  book_id INT REFERENCES book (id) ON UPDATE CASCADE,
  author_id INT REFERENCES author (id) ON UPDATE CASCADE ON DELETE CASCADE,
  PRIMARY KEY (book_id, author_id)

);


CREATE TABLE IF NOT EXISTS section (

  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL

);


CREATE TABLE IF NOT EXISTS book_section (

  book_id INT REFERENCES book (id) ON UPDATE CASCADE,
  section_id INT REFERENCES section (id) ON UPDATE CASCADE,
  book_count INT NOT NULL,
  available_count INT NOT NULL,
  PRIMARY KEY (book_id, section_id)

);


CREATE TABLE IF NOT EXISTS book_event (

  reader_id INT NOT NULL,
  section_id INT REFERENCES section (id) ON UPDATE CASCADE,
  book_id INT REFERENCES book (id) ON UPDATE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  order_date DATE,
  event_state VARCHAR(45) NOT NULL,
  violation VARCHAR(45),
  punishment VARCHAR(45),
  sanctions_period SMALLINT,
  PRIMARY KEY (reader_id, section_id, book_id)

);
