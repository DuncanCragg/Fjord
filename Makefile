
tests: run-tests kill-test-server


set-up-dbs:
	cp fjord-tests-saved.db fjord.db
	cp fjord-test-saved.db  fjord-test.db

run-tests: set-up-dbs run-test-server
	( node language-tests.js; node observer-tests.js; node instrument-tests.js; node persistence-tests.js; node networking-tests.js ) | egrep Pass

run-test-server: set-up-dbs
	./test-server.js 2>&1 > /dev/null &

run-ts: set-up-dbs
	./test-server.js

kill-test-server:
	pkill node


