
test: clean-db run-test-server run-tests kill-test-server

run-tests:
	( node language-tests.js; node observer-tests.js; node instrument-tests.js; node persistence-tests.js; node networking-tests.js ) | egrep Pass

run-test-server:
	cp test-server/fjord-test.db test-server/fjord.db
	( cd test-server; ./test-server.js & )

kill-test-server:
	pkill node

clean-db:
	rm -f fjord.db

