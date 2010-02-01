
test:
	rm fjord.db
	( node language-tests.js; node observer-tests.js; node persistence-tests.js; node network-tests.js; node instrument-tests.js ) | egrep Pass
	
