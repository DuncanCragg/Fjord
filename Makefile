
test: clean-db run-test-server
	( node language-tests.js; node observer-tests.js; node persistence-tests.js; node network-tests.js; node instrument-tests.js ) | egrep Pass

run-test-server:
	cp test-server/fjord-test.db test-server/fjord.db
	( cd test-server; ./test-server.js & )

clean-db:
	rm -f fjord.db

