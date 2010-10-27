
tests: kill-test-server run-tests

ins-tests: kill-test-server run-ins-tests

net-tests: kill-test-server run-net-tests

set-up-dbs:
	cp fjord-tests-saved.db fjord.db
	cp fjord-test-saved.db  fjord-test.db

remove-dbs:
	rm -f fjord.db fjord-test.db

run-tests: set-up-dbs run-test-server
	( node language-tests.js; node observer-tests.js; node instrument-tests.js; node persistence-tests.js; node networking-tests.js ) | egrep Pass

run-obs-tests: remove-dbs
	node observer-tests.js

run-ins-tests: set-up-dbs run-test-server pause
	node instrument-tests.js

run-net-tests: set-up-dbs run-test-server pause
	node networking-tests.js

run-test-server: set-up-dbs
	./test-server.js 2>&1 > server.log &

run-ts: set-up-dbs
	./test-server.js

pause:
	sleep 0.5

kill-test-server:
	pkill node || echo nothing running


