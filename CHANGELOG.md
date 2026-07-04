# Changelog

All notable changes to this project are documented here.

## [1.1.0] - 2026-07-04

### Added
- Predator mode: a hawk that hunts the flock, causing boids to flee and scatter. Choose Off, Cursor (chases the pointer), or Roam (stalks the nearest boid).
- Click-placed circular obstacles that the flock steers around, with a Clear obstacles button.
- Color-mode selector: Velocity (hue by heading), Rainbow (per-boid tints), and Mono.
- On-screen readout of live FPS and current boid count.

### Changed
- Subtle gradient background rendered on the canvas.
- Polished agent glow and refreshed obstacle and predator visuals.
- Tidied and expanded the control panel.

## [1.0.0] - 2026-07-04

Initial release.
- Boids flocking with Separation, Alignment, and Cohesion sliders plus vision radius.
- Cursor attract / repel / off herding.
- Spatial-hash grid for smooth performance with hundreds of boids.
- Velocity-tinted glowing agents, optional motion trails, edge wrapping, and a hideable panel.
