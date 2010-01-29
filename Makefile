
test:
	rm fjord.db
	( node language-tests.js; node observer-tests.js; node db-driver-tests.js; node instrument-tests.js ) | egrep Pass
	
