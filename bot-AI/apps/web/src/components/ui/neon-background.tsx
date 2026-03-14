'use client';

const PARTICLE_POSITIONS = [
  { left: '5%',  delay: '0s',   duration: '12s' },
  { left: '10%', delay: '2s',   duration: '10s' },
  { left: '15%', delay: '1s',   duration: '14s' },
  { left: '20%', delay: '3s',   duration: '11s' },
  { left: '25%', delay: '1.5s', duration: '13s' },
  { left: '30%', delay: '2.5s', duration: '9s'  },
  { left: '35%', delay: '0.5s', duration: '15s' },
  { left: '40%', delay: '3.5s', duration: '10s' },
  { left: '45%', delay: '1s',   duration: '12s' },
  { left: '50%', delay: '2s',   duration: '11s' },
  { left: '55%', delay: '0s',   duration: '13s' },
  { left: '60%', delay: '3s',   duration: '10s' },
  { left: '65%', delay: '1.5s', duration: '14s' },
  { left: '70%', delay: '2.5s', duration: '9s'  },
  { left: '75%', delay: '0.5s', duration: '12s' },
  { left: '80%', delay: '3.5s', duration: '11s' },
  { left: '85%', delay: '1s',   duration: '15s' },
  { left: '90%', delay: '2s',   duration: '10s' },
  { left: '95%', delay: '1.5s', duration: '13s' },
  { left: '50%', delay: '0.5s', duration: '11s' },
];

export function NeonBackground() {
  return (
    <>
      {/* Background layer: orbs (position 1-3) + grid (z-index: -1, behind all content) */}
      <div aria-hidden="true" className="neon-orb-container">
        {[0, 1, 2].map((i) => (
          <div key={`orb-${i}`} className="neon-orb" />
        ))}
        <div className="neon-grid-bg" />
      </div>

      {/* Foreground layer: particles (float above content) */}
      <div aria-hidden="true" className="neon-bg-container">
        {PARTICLE_POSITIONS.map((pos, i) => (
          <div
            key={`particle-${i}`}
            className="neon-particle"
            style={{
              left: pos.left,
              animationDelay: pos.delay,
              animationDuration: pos.duration,
            }}
          />
        ))}
      </div>
    </>
  );
}
