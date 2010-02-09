
tests: clean-db run-test-server run-tests kill-test-server

run-tests:
	( node language-tests.js; node observer-tests.js; node instrument-tests.js; node persistence-tests.js; node networking-tests.js ) | egrep Pass

run-test-server:
	cp fjord-test-saved.db fjord-test.db
	./test-server.js 2>&1 > /dev/null &

run-ts:
	cp fjord-test-saved.db fjord-test.db
	./test-server.js

kill-test-server:
	pkill node

clean-db:
	rm -f fjord.db

