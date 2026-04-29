# Security Policy

## Reporting a vulnerability

**Do not** open a public GitHub issue for security reports.

Please use [GitHub's private vulnerability reporting](https://github.com/anilkumarthakur60/vue3-select/security/advisories/new)
instead. We aim to acknowledge reports within 72 hours and to ship a fix or
mitigation within 14 days for high-severity issues.

If you'd prefer email, write to `anilkumarthakur60@gmail.com` and include:

- A description of the vulnerability and its impact
- Reproduction steps or a minimal proof-of-concept
- Your suggested fix, if any

We'll credit reporters in the release notes unless you'd rather stay
anonymous.

## Scope

In scope:

- The published `vue3-select` package on npm
- Source code in this repository
- The shipped Nuxt module (`vue3-select/nuxt`)

Out of scope:

- Vulnerabilities in `vue`, `@floating-ui/vue`, `@nuxt/kit`, or any other
  upstream dependency — please report those to the respective project
- Issues only reproducible with substantially modified forks of the source
- Self-XSS via consumer-controlled markup passed into slots (consumers are
  responsible for sanitising HTML they render through the `option` /
  `value` / `tag` slots)
