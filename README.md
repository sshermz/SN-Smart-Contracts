# SingularityNET Smart Contracts Demo #

**Prototype Demo version with mock data. This is an in-progress version and requires further development work, including that the data schemas and data handling needs refactoring, etc.**

Derived from [SB Admin rewritten in Angular4 and Bootstrap 4](https://github.com/start-angular/SB-Admin-BS4-Angular-4).

### Usage

**Note** that this seed project requires  **node >=v6.9.0 and npm >=3**.

In order to start the project use:
```bash
$ git clone https://github.com/sshermz/SN-Smart-Contracts
$ cd SN Smart Contracts

# install the project's dependencies
$ npm install

# watches your files and uses livereload by default run `npm start` for a dev server. Navigate to 
# `http://localhost:4201/dashboard`. The app will automatically reload if you change any of the 
# source files. If you get the login page, enter anything or nothing and click on the Login button.
$ npm start

# As above but to override the default port
$ ng serve --ec true --port 8080

# prod build, will output the production application in `dist`
# the produced code can be deployed (rsynced) to a remote server
$ npm run build
```

Install Steps for deploying prebuilt production build (./dist files) on Node.js http-server:
```
These steps assume that you have been provided the ./dist subdirectory from a production build via 
'npm run build'.

1) Install Node.js

https://nodejs.org/en/download/
There are installers for Windows, macOS, Linux, Docker, etc.

Note that NPM is Node.js's package manager and is installed automatically with Node.js.

To verify success, you can check the versions from the cli. Examples:
$ node -v
v6.11.2
$ npm -v
3.10.10

2) Install http-server
$ npm install -g http-server

To verify success, run it with the help option.
$ http-server -help

3) Copy dist subfolder to your demo directory
Create a directory in your preferred location.
Copy/paste the prebuilt SN Demo ./dist directory to that location.

4) Start up http-server with SN Demo files
Open cli to the root demo directory you created in step 3. Then start http-server:
$ http-server ./dist

Or specify a port like so:
$ http-server -p 8080 ./dist

You should see something like this:
Starting up http-server, serving ./dist
Available on:
  http://255.255.255.255:8080

In fact, there may be several URLs. Copy/paste any of the URLs into your browser. Chrome recommended, 
but should work with other browsers (not tested yet).
```
---

Original README below for reference

---

## SB Admin rewritten in Angular4 and Bootstrap 4

Simple Dashboard Admin App built using Angular 4 and Bootstrap 4

This project is a port of the famous Free Admin Bootstrap Theme [SB Admin v4.0](http://startbootstrap.com/template-overviews/sb-admin-2/) to Angular4 Theme.

Powered by [StartAngular](http://startangular.com/) & [StrapUI](http://strapui.com/)

## [Demo](http://rawgit.com/start-angular/SB-Admin-BS4-Angular-4/master/dist/)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.0.0.

### Introduction
Provides fast, reliable and extensible starter for the development of Angular projects.

`sb-admin-bs4-angular4` provides the following features:
- Developed using boostrap-v4.0.0-alpha.6
- angular-v4.2.4
- angular/cli-v1.1.3
- Following the best practices.
- Ahead-of-Time compilation support.
- Official Angular i18n support.
- Production and development builds.
- Tree-Shaking production builds.

### How to start
**Note** that this seed project requires  **node >=v6.9.0 and npm >=3**.

In order to start the project use:
```bash
$ git clone https://github.com/start-angular/SB-Admin-BS4-Angular-4
$ cd SB-Admin-BS4-Angular-4
# install the project's dependencies
$ npm install
# watches your files and uses livereload by default run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
$ npm start
# prod build, will output the production application in `dist`
# the produced code can be deployed (rsynced) to a remote server
$ npm run build
```

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class/module`.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
