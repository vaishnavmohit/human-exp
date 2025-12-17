# 🚀 Quick Deployment Guide - Group Assignment Fix

## ⚡ TL;DR - What Changed?

**Problem**: Group assignment wasn't tracked in sessions/responses, no verification on resume  
**Solution**: Added `assigned_group` column + verification logic  
**Time**: ~30 minutes to deploy  

---

## 📋 Deployment Checklist (30 min)

### □ Step 1: Database Migration (5 min)

1. **Login to Supabase**
   - Go to your project dashboard
   - Click "SQL Editor" in left sidebar

2. **Run Migration**
   - Click "New Query"
   - Copy/paste: `docs/MIGRATION_ADD_ASSIGNED_GROUP.sql`
   - Click "Run" (green play button)
   - ✅ Should see "SUCCESS" messages

3. **Verify**
   ```sql
   \d sessions    -- Should show assigned_group column
   \d responses   -- Should show assigned_group column
   ```

---

### □ Step 2: Code is Already Changed (0 min)

✅ All code changes already committed in this session:
- Type definitions updated
- API routes updated  
- Frontend verification added
- Group validation added

**Just need to deploy!**

---

### □ Step 3: Deploy to Production (5 min)

#### If using Vercel:
```bash
git add .
git commit -m "feat: add group assignment tracking and verification"
git push origin main
```
Vercel will auto-deploy in ~2 minutes.

#### If using other platform:
Follow your normal deployment process.

---

### □ Step 4: Test in Production (10 min)

**Quick Smoke Test** (2 min):

1. Visit: `https://your-app.com/test001?group=1`
2. Should see quiz load successfully
3. Answer 1 question
4. Check Supabase → `responses` table
5. Verify `assigned_group = 1` ✅

**Group Mismatch Test** (2 min):

1. Create participant with group 1
2. Start quiz at `?group=1`
3. Try to access `?group=4`
4. Should see error + redirect to `?group=1` ✅

**Full Test** (6 min):
- Follow `docs/TESTING_GROUP_ASSIGNMENT.md` Tests 1-4

---

### □ Step 5: Verify Data Integrity (5 min)

Run in Supabase SQL Editor:

```sql
-- Should return 0 rows (no mismatches)
SELECT 
  r.participant_id,
  p.assigned_group as participant_group,
  s.assigned_group as session_group,
  r.assigned_group as response_group
FROM responses r
JOIN participants p ON r.participant_id = p.participant_id
JOIN sessions s ON r.session_id = s.id
WHERE p.assigned_group != s.assigned_group 
   OR s.assigned_group != r.assigned_group;
```

✅ 0 rows = Success!

---

## 🎯 What to Monitor

### After deployment, watch for:

**Supabase Dashboard** → Table Editor:
- ✅ New `sessions` have `assigned_group`
- ✅ New `responses` have `assigned_group`

**Browser Console** (for test participants):
- ✅ No red errors
- ✅ See "🔄 Resuming previous session..." when resuming
- ✅ See "✅ Response saved" when answering

**Application Logs**:
- ✅ No 400/500 errors on `/api/sessions` or `/api/responses`

---

## ⚠️ Potential Issues & Fixes

### Issue: "Column assigned_group does not exist"
**Cause**: Migration not run  
**Fix**: Run Step 1 again

### Issue: "Missing required fields: assigned_group"  
**Cause**: Old code cached  
**Fix**: Hard refresh browser (Cmd+Shift+R), clear Vercel cache

### Issue: Responses still missing assigned_group
**Cause**: Code not deployed  
**Fix**: Check deployment status, trigger manual deploy

### Issue: Can't access quiz at all
**Cause**: Breaking change in API  
**Fix**: Check browser console, verify both DB + code deployed

---

## 🔄 Rollback Plan (if needed)

**If something goes wrong:**

1. **Database Rollback** (2 min):
   ```sql
   -- In Supabase SQL Editor
   ALTER TABLE sessions DROP COLUMN assigned_group;
   ALTER TABLE responses DROP COLUMN assigned_group;
   ```

2. **Code Rollback**:
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Verify**: Check old session still works

---

## 📊 Success Metrics

### Immediate (within 1 hour):
- [ ] No deployment errors
- [ ] Test participant can complete quiz
- [ ] Data appears in Supabase with `assigned_group`

### Short-term (within 24 hours):
- [ ] Real participants can access their groups
- [ ] No spike in errors/support requests
- [ ] Group mismatch redirects working

### Long-term (within 1 week):
- [ ] All responses have `assigned_group` populated
- [ ] Data analysis queries work correctly
- [ ] No data inconsistencies detected

---

## 📞 Need Help?

**Before Production**: Review these docs:
1. `docs/PRE_PRODUCTION_CHECKLIST.md` - Full details
2. `docs/TESTING_GROUP_ASSIGNMENT.md` - Complete tests
3. `docs/GROUP_ASSIGNMENT_SUMMARY.md` - Implementation overview

**During Deployment**: 
- Check deployment logs in Vercel/platform
- Monitor Supabase logs for database errors
- Test with `test_participant_xxx` IDs first

**After Deployment**:
- Run data integrity queries
- Check browser console for errors
- Test with 2-3 real participant flows

---

## ✨ What You Get

After this deployment:

✅ **Data Integrity**: Every response tagged with experimental group  
✅ **Security**: Users can't manipulate URLs to see wrong content  
✅ **Analytics**: Easy queries by group without complex joins  
✅ **Validation**: Config-based prevention of invalid groups  
✅ **Debugging**: Clear errors when something goes wrong  

---

## 🎉 You're Ready!

**Total Time**: ~30 minutes  
**Risk Level**: Low (includes rollback)  
**Complexity**: Medium (well-documented)

**Remember**:
1. Test with test participants first
2. Monitor for 1 hour after deployment
3. Run data integrity check after first real responses
4. Keep rollback plan ready (just in case)

---

**Last Updated**: December 17, 2025  
**Version**: 1.0  
**Status**: Ready for Production 🚀
