# Boids — Flocking Simulation

An interactive implementation of Craig Reynolds' classic [**Boids**](https://en.wikipedia.org/wiki/Boids) algorithm. Hundreds of simple agents follow just three local rules and produce lifelike, emergent flocking — murmurations that swirl, split, and re-form in real time.

![tech](https://img.shields.io/badge/Canvas-2D-59a8ff) ![deps](https://img.shields.io/badge/dependencies-none-5ff0d0) ![license](https://img.shields.io/badge/license-MIT-yellow)

## Features
- The **three rules** — Separation, Alignment, Cohesion — each on a live slider so you can watch the flock's personality change
- **Cursor herding** — attract or repel the flock with your mouse
- **Spatial-hash grid** for neighbor lookups → smooth with 600+ boids
- Velocity-tinted, glowing agents + optional motion **trails**
- Toroidal world (boids wrap around the edges)

## Controls
| Input | Action |
|-------|--------|
| Sliders | Tune the flocking rules & vision radius |
| Attract / Repel / Off | Cursor behavior |
| Mouse | Herd the flock |
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
