# Auth Testing Playbook (Emergent Google Auth)

See integration playbook output for full instructions. Key points:

## Test User & Session
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({user_id:userId, email:'test'+Date.now()+'@e.com', name:'Test', picture:'', created_at:new Date()});
db.user_sessions.insertOne({user_id:userId, session_token:sessionToken, expires_at:new Date(Date.now()+7*86400000), created_at:new Date()});
print(sessionToken);
"

## Test endpoints
curl -X GET "$URL/api/auth/me" -H "Authorization: Bearer $TOKEN"

## Browser
Set cookie session_token (httpOnly, secure, sameSite=None) then navigate to root.

## Critical rules
- redirect_url = window.location.origin + '/' (no fallbacks, no hardcoding)
- Detect session_id in URL **hash** during render (NOT useEffect)
- AuthProvider must skip /auth/me check if hash contains session_id
- Backend reads session_token from cookie OR Authorization header
- All MongoDB queries use {"_id":0} projection
- Use custom user_id (uuid), never expose MongoDB _id
- Use timezone.utc for all datetimes
