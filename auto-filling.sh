# run from project root

# set credentials
source data-generator/credentials

APPLICANT=500
CERTIFICATION_TRAINING=250
POSTGRADUATE=500
PREPARATORY=250
STUDENT=1000
TEACHER=500

BOOKS=5000

printf "Cleaning database ${DB_NAME}..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME}" > /dev/null
printf " Done\n"

printf "Creating schema..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d postgres -f simple-database/create_database.sql > /dev/null
printf " Done\n\n"

printf "Filling\n\n"
cd data-generator
rm -rf logs/*

printf "Generating info for applicant table (${APPLICANT} rows)..."
node table-generator.js table=applicant rows_count=$APPLICANT > logs/tables.log
printf " Generated\n";
printf "Inserting into database..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f sql/applicant.sql > /dev/null
printf " Done\n\n"

printf "Generating info for certification_training table (${CERTIFICATION_TRAINING} rows)..."
node table-generator.js table=certification_training rows_count=$CERTIFICATION_TRAINING >> logs/tables.log
printf " Generated\n";
printf "Inserting into database..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f sql/certification_training.sql > /dev/null
printf " Done\n\n"

printf "Generating info for postgraduate table (${POSTGRADUATE} rows)..."
node table-generator.js table=postgraduate rows_count=$POSTGRADUATE >> logs/tables.log
printf " Generated\n";
printf "Inserting into database..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f sql/postgraduate.sql > /dev/null
printf " Done\n\n"

printf "Generating info for preparatory table (${PREPARATORY} rows)..."
node table-generator.js table=preparatory rows_count=$PREPARATORY >> logs/tables.log
printf " Generated\n";
printf "Inserting into database..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f sql/preparatory.sql > /dev/null
printf " Done\n\n"

printf "Generating info for student table (${STUDENT} rows)..."
node table-generator.js table=student rows_count=$STUDENT >> logs/tables.log
printf " Generated\n";
printf "Inserting into database..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f sql/student.sql > /dev/null
printf " Done\n\n"

printf "Generating info for teacher table (${TEACHER} rows)..."
node table-generator.js table=teacher rows_count=$TEACHER >> logs/tables.log
printf " Generated\n";
printf "Inserting into database..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f sql/teacher.sql > /dev/null
printf " Done\n\n"

printf "Generating info for section table..."
node table-generator.js table=section  >> logs/tables.log
printf " Generated\n";
printf "Inserting into database..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f sql/section.sql > /dev/null
printf " Done\n\n"

printf "Grabbing books from OpenLibrary.org (${BOOKS} books)... "
node openlibrary-grabber.js books=$BOOKS > logs/grabber.log
printf " Grabbed\n\n"

printf "Creating relations Book-Author..."
node relation-generator tables=book+author > logs/book-author-relations.log
printf " Created\n"

printf "Creating relations Book-Section..."
node relation-generator tables=book+section > logs/book-section-relations.log
printf " Created\n"

printf "Creating relations Book-Section-Reader..."
node relation-generator tables=book+section+reader > logs/book-section-reader-relations.log
printf " Created\n\n"

printf "Database ${DB_NAME} successfully filled\n"
