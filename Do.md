apps/web
Build Command
turbo run build
Output Directory
Next.js default
Install Command
npm install --prefix=../..
Deployment
Deployment failed with error.
Build Logs
18s
54 lines
Find in logs
CtrlF
11:02:13.905 Running build in Washington, D.C., USA (East) – iad1
11:02:13.906 Build machine configuration: 2 cores, 8 GB
11:02:14.127 Cloning github.com/SuminChhetri/OHSA-PDF (Branch: master, Commit: 798c027)
11:02:14.128 Previous build caches not available.
11:02:14.538 Cloning completed: 411.000ms
11:02:14.819 Running "vercel build"
11:02:14.842 Vercel CLI 53.3.2
11:02:14.889 > Detected Turbo. Adjusting default settings...
11:02:15.063 Running "install" command: `npm install --prefix=../..`...
11:02:17.411 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
11:02:17.477 npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
11:02:19.407 npm warn deprecated uuid@8.3.2: uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).
11:02:30.745 
11:02:30.746 added 309 packages, and audited 313 packages in 16s
11:02:30.746 
11:02:30.747 66 packages are looking for funding
11:02:30.747   run `npm fund` for details
11:02:30.838 
11:02:30.839 7 vulnerabilities (6 moderate, 1 high)
11:02:30.840 
11:02:30.840 To address all issues (including breaking changes), run:
11:02:30.841   npm audit fix --force
11:02:30.841 
11:02:30.841 Run `npm audit` for details.
11:02:30.891 Detected Next.js version: 14.2.35
11:02:30.893 Running "turbo run build"
11:02:31.045 
11:02:31.046    • Packages in scope: @osha/web
11:02:31.046    • Running build in 1 packages
11:02:31.046    • Remote caching enabled
11:02:31.046 
11:02:31.150 @osha/regulatory-logic:build: cache miss, executing 7dbdf9c348d53ba1
11:02:31.279 @osha/regulatory-logic:build: 
11:02:31.280 @osha/regulatory-logic:build: > @osha/regulatory-logic@0.1.0 build
11:02:31.280 @osha/regulatory-logic:build: > tsc --project tsconfig.build.json
11:02:31.280 @osha/regulatory-logic:build: 
11:02:31.435 @osha/regulatory-logic:build: error TS5058: The specified path does not exist: 'tsconfig.build.json'.
11:02:31.443 @osha/regulatory-logic:build: npm error Lifecycle script `build` failed with error:
11:02:31.443 @osha/regulatory-logic:build: npm error code 1
11:02:31.444 @osha/regulatory-logic:build: npm error path /vercel/path0/packages/regulatory-logic
11:02:31.444 @osha/regulatory-logic:build: npm error workspace @osha/regulatory-logic@0.1.0
11:02:31.444 @osha/regulatory-logic:build: npm error location /vercel/path0/packages/regulatory-logic
11:02:31.444 @osha/regulatory-logic:build: npm error command failed
11:02:31.445 @osha/regulatory-logic:build: npm error command sh -c tsc --project tsconfig.build.json
11:02:31.450  ERROR  @osha/regulatory-logic#build: command (/vercel/path0/packages/regulatory-logic) /node24/bin/npm run build exited (1)
11:02:31.450 
11:02:31.450   Tasks:    0 successful, 1 total
11:02:31.451  Cached:    0 cached, 1 total
11:02:31.451    Time:    511ms 
11:02:31.451 Summary:    /vercel/path0/.turbo/runs/3DlPb7nmPt096AbzJ8jsDi352fX.json
11:02:31.451  Failed:    @osha/regulatory-logic#build
11:02:31.451 
11:02:31.452  ERROR  run failed: command  exited (1)
11:02:31.465 Error: Command "turbo run build" exited with 1