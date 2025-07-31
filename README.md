![The Chronos Companion icon with a Jira UI screenshot](.github/repo-header.png)

**Chronos Companion** is a browser extension for [Jira Time Tracker](https://github.com/nice-af/chronos-app) that allows you to start timers directly from Jira issues in your browser. It is built with [Plasmo](https://plasmo.com/).

## Publishing

The repo includes a GitHub Action that manually (needs to be activated) publishes the extension to the Chrome Web Store, Firefox Add-ons, and Microsoft Edge Add-ons when a new release is created.
Before publishing, you need to release a new version of the extension by running:

```bash
npm run release
```