# Boids — Flocking Simulation

An interactive implementation of Craig Reynolds' classic [**Boids**](https://en.wikipedia.org/wiki/Boids) algorithm. Hundreds of simple agents follow just three local rules and produce lifelike, emergent flocking — murmurations that swirl, split, and re-form in real time.

![version](https://img.shields.io/badge/version-1.1.0-blue) ![tech](https://img.shields.io/badge/Canvas-2D-59a8ff) ![deps](https://img.shields.io/badge/dependencies-none-5ff0d0) ![license](https://img.shields.io/badge/license-MIT-yellow)

## Features
- The **three rules** — Separation, Alignment, Cohesion — each on a live slider so you can watch the flock's personality change
- **Cursor herding** — attract or repel the flock with your mouse
- **Predator mode** — unleash a hawk that hunts the flock; boids flee and scatter. It can chase the cursor or roam and stalk the nearest boid
- **Obstacles** — click anywhere to drop a circular obstacle the flock steers around; clear them all with one button
- **Color modes** — Velocity (hue by heading), Rainbow (per-boid tints), or Mono
- **Live readout** — on-screen FPS and current boid count
- **Spatial-hash grid** for neighbor lookups so it stays smooth with 600+ boids
- Glowing agents over a subtle gradient backdrop, plus optional motion **trails**
- Toroidal world (boids wrap around the edges)

## Controls
| Input | Action |
|-------|--------|
| Sliders | Tune the flocking rules and vision radius |
| Attract / Repel / Off | Cursor behavior |
| Predator: Off / Cursor / Roam | Toggle the hawk and choose how it hunts |
| Color: Velocity / Rainbow / Mono | Choose how boids are colored |
| Clear obstacles | Remove all placed obstacles |
| Mouse move | Herd the flock |
| Mouse click | Drop a circular obstacle |
| `H` | Hide / show the panel |

## The rules
1. **Separation** — steer away from crowding neighbors
2. **Alignment** — steer toward the average heading of neighbors
3. **Cohesion** — steer toward the average position of neighbors

No boid knows about the flock as a whole; the flock is an *emergent* property of these local interactions.

## Run it
Open `index.html`. With XAMPP, visit `http://localhost/boids-flock/`.

## License
MIT.
