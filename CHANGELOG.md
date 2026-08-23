# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2026-08-23

### Added

- **Double-faced card support.** A front card names its back face via a new
  "Retro" column. On export, both faces are linked the way Cockatrice models
  double-faced cards: the front becomes a `transform` layout with
  `<side>front</side>` and a `<related attach="transform">` tag naming the back,
  and the back becomes a `transform` layout with `<side>back</side>` and a
  `<reverse-related attach="transform">` tag naming the front. Cards without a
  Retro link keep the normal layout unchanged.
- **Retro link validation.** Exporting now warns about broken double-faced
  links: a Retro pointing at a card that doesn't exist, a card naming itself as
  its own back face, a back face referenced by multiple fronts, or a back face
  that also carries its own Retro value.
- **Landscape/portrait orientation for templates.** The template designer gains
  a Portrait/Landscape toggle that rotates the whole layout 90° so layers follow
  the new orientation. Exported images stay portrait-sized — a landscape design
  is rotated into a portrait frame so the physical card is simply turned sideways
  to be read horizontally. Card previews now derive their aspect ratio from the
  template's orientation.

## [1.5.0] - 2026-06-16

Baseline release prior to this changelog.

[1.6.0]: https://github.com/LeoCal4/slayer-card-creator/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/LeoCal4/slayer-card-creator/releases/tag/v1.5.0
