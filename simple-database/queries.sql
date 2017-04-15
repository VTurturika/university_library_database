-- 1 --
SELECT DISTINCT s.*
FROM book_event be
INNER JOIN (
	SELECT DISTINCT * FROM student
	WHERE faculty='Механіко-математичний факультет'
) s
ON s.reader_id = be.reader_id
WHERE be.section_id = 3

-- 2 --
SELECT b.days_keep_count, bes.start_date
FROM book b
INNER JOIN (
	SELECT be.*, s.reader_id, s.last_name, s.first_name FROM book_event be
	INNER JOIN (
		SELECT DISTINCT * FROM reader
		WHERE faculty='Механіко-математичний факультет'
	) s
	ON s.reader_id = be.reader_id
	WHERE be.event_state = 'на руках'
) bes
ON bes.book_id = b.id
WHERE  bes.start_date + b.days_keep_count < CURRENT_DATE;

-- 3 --
SELECT book_id, count(book_id)
FROM book_event
WHERE section_id = 3
GROUP BY book_id
ORDER BY count(book_id) DESC LIMIT 20

-- 4 --
SELECT b.*
FROM book b
INNER JOIN (
	SELECT * FROM book_event
	WHERE violation='загублена'
) be
ON b.id = be.book_id
WHERE (b.adding_date BETWEEN current_date - INTERVAL '1 year' AND current_date)
OR (be.start_date BETWEEN current_date - INTERVAL '1 year' AND current_date
AND be.end_date BETWEEN current_date - INTERVAL '1 year' AND current_date);

-- 5 --
SELECT section_id, count(reader_id), sum(punishment_cost)
FROM book_event
WHERE violation = 'загублена' GROUP BY section_id ORDER BY sum desc

-- 6 --
SELECT b.*
FROM book_event be
INNER JOIN (
	SELECT * FROM book
) b
ON b.id = be.book_id
WHERE section_id=1
AND be.order_date BETWEEN current_date - INTERVAL '1 year' AND current_date;

-- 7 --
SELECT b.id, b.title, bs.book_count
FROM book_section bs
INNER JOIN (
	SELECT * FROM book
) b
ON b.id = bs.book_id
WHERE section_id=3

-- 8 --
SELECT r.reader_id, r.last_name, r.first_name, be.sanctions_period
FROM reader r
INNER JOIN (
	SELECT * FROM book_event
	WHERE sanctions_period >= 2
) be
ON r.reader_id = be.reader_id;

-- 9 --
SELECT r.*
FROM book_event be
INNER JOIN (
	SELECT * FROM reader
) r
ON r.reader_id = be.reader_id
WHERE section_id=2
AND be.start_date BETWEEN current_date - INTERVAL '1 year' AND current_date;

--10--
SELECT b.*, be.order_date, be.start_date, be.end_date
FROM book b
INNER JOIN (
	SELECT * FROM book_event
	WHERE reader_id=1800
	AND (start_date BETWEEN current_date - INTERVAL '1 year' AND current_date
	OR event_state='на руках')
) be
ON b.id = be.book_id;

-- 11 --
SELECT section_id, book_count, available_count
FROM book_section
WHERE book_id = 123

-- 12 --
SELECT be.reader_id, be.section_id, be.book_id, be.start_date,
       b.days_keep_count, be.start_date + b.days_keep_count estimated_end
FROM book_event be
INNER JOIN (
	SELECT * FROM book
) b
ON be.book_id=b.id
WHERE event_state='на руках'

-- 13 --
SELECT r.*, be.*
FROM reader r
INNER JOIN (
	SELECT * FROM book_event
) be
ON be.reader_id=r.reader_id
WHERE r.reader_id=1305
