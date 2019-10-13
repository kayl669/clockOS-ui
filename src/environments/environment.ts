// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: false,
  api: 'ws://alarmclock:6123/websocket',
  appId: '16ac9d6bce0fb304213edb1ab09b120c',
  backUrl: 'http://alarmClock:3000',
  city: 'Combaillaux'
};
