# Collision Box Analysis & Implementation

## Overview
This document details the sprite-based collision box design implemented after visual analysis of all character and obstacle sprites.

---

## Character Collision Boxes

### Design Principle
**Exclude decorative elements** (hair, horns, accessories) from hitboxes to create fair gameplay where only the actual body can be hit.

### Boss Character (Mini Boss)

**Sprite Analysis:**
- Large bulky character with horns
- Torso and arms are primary body mass
- Horns extend ~25% above body
- Body is ~70% of total sprite width

**Idle State:**
- **Width:** 85px (~60% of sprite)
- **Height:** 88px (~75% excluding horns)
- **Offset X:** 19px (centered on body)
- **Offset Y:** onGroundPosition + 22px (excludes horns)

**Running State:**
- **Width:** 95px (arms extended)
- **Height:** 88px (same)
- **Offset X:** 14px (adjusted for arm extension)
- **Offset Y:** onGroundPosition + 22px

**Rationale:** Excludes horns completely. Tight to body mass but allows slight extension for arms during running animation.

---

### Pijamas Character

**Sprite Analysis:**
- Slim character with puffy hair
- Hair represents ~30% of top area
- Body is narrow, ~50% of sprite width
- Running pose extends slightly wider

**Idle State:**
- **Width:** 45px (~50% of sprite)
- **Height:** 70px (~70% excluding hair)
- **Offset X:** 7px (centered on body)
- **Offset Y:** onGroundPosition + 25px (excludes hair)

**Running State:**
- **Width:** 55px (legs/arms wider)
- **Height:** 70px (same)
- **Offset X:** 12px (adjusted for running pose)
- **Offset Y:** onGroundPosition + 25px

**Rationale:** Hair is cosmetic and excluded. Hitbox covers torso and limbs only. Running state slightly wider to account for leg extension.

---

### Blue Character

**Sprite Analysis:**
- Smallest character with spiky hair
- Hair extends ~35% above body
- Very slim build, ~40% of sprite width
- Most agile character design

**Idle State:**
- **Width:** 30px (~40% of sprite)
- **Height:** 58px (~65% excluding hair)
- **Offset X:** 5px (centered on body)
- **Offset Y:** onGroundPosition + 25px (excludes hair)

**Running State:**
- **Width:** 38px (slightly wider)
- **Height:** 58px (same)
- **Offset X:** 6px (adjusted for running pose)
- **Offset Y:** onGroundPosition + 25px

**Rationale:** Smallest hitbox matches smallest character. Spiky hair completely excluded. Tight hitbox rewards skilled play with this character.

---

## Obstacle Collision Boxes

### Design Principle
**Only the dangerous part counts** - visual decorations like ground shadows, edges, or non-threatening areas are excluded.

### Lava Obstacle

**Sprite Analysis:**
- Low, flat puddle with bubbling center
- Bubbling lava is the actual danger zone
- Edges are mostly dark ground texture
- Danger zone is ~60% of width, ~40% of height

**Configuration:**
```typescript
'enemy-lava': {
  scale: 1.4,
  body: {
    widthRatio: 0.60,          // Only bubbling lava center
    heightRatio: 0.40,          // Danger zone of bubbling lava
    offsetXRatio: 0.20,         // Center the danger zone
    bottomPaddingRatio: 0.25,   // Leave space at bottom for ground
    anchor: 'bottom'
  }
}
```

**Rationale:** Only the actively bubbling orange/red center counts as dangerous. Dark edges and ground area excluded for fair gameplay.

---

### Toxic Waste Barrel

**Sprite Analysis:**
- Barrel with toxic liquid spilling out
- Main barrel is ~55% of total width
- Toxic liquid on top adds danger zone
- Bottom has shadow/ground texture

**Configuration:**
```typescript
'enemy-toxic-waste': {
  scale: 1.5,
  body: {
    widthRatio: 0.55,          // Main barrel body only
    heightRatio: 0.50,          // Barrel + toxic liquid
    offsetXRatio: 0.22,         // Center the barrel
    bottomPaddingRatio: 0.15,   // Leave space at bottom
    anchor: 'bottom'
  }
}
```

**Rationale:** Hitbox covers solid barrel and toxic liquid. Wooden edges and ground shadow excluded.

---

## Debug Visualization

### Press 'P' Key
Toggle collision box visualization during gameplay to see:
- Green rectangles showing actual hitboxes
- Red center dots marking body centers
- Real-time updates as sprites move

### Visualization Features
- Manual graphics drawing for stability
- No flickering (recreated each frame)
- High z-index (10000) to stay on top
- Clean toggle on/off

---

## Gameplay Impact

### Before Changes
- Characters: Hitboxes included hair/horns
- Lava: Full sprite width counted as danger
- Toxic Waste: Entire sprite was dangerous
- Result: Unfair collisions, frustrating gameplay

### After Changes
- Characters: Only body mass counts
- Lava: Only bubbling center is dangerous
- Toxic Waste: Only barrel/liquid is dangerous
- Result: Fair collisions that match visual expectations

### Difficulty Balance
- **Boss:** Largest hitbox (85-95px wide)
- **Pijamas:** Medium hitbox (45-55px wide)
- **Blue:** Smallest hitbox (30-38px wide)

Characters are now balanced by hitbox size, rewarding players who choose smaller characters with tighter collision detection.

---

## Testing Recommendations

### Visual Verification
1. Press 'P' to enable debug mode
2. Play with each character
3. Verify hitbox aligns with body (not hair/horns)
4. Check running vs idle states

### Collision Testing
1. Test near-misses with lava (should pass over edges safely)
2. Test near-misses with barrels (should avoid edges)
3. Jump over obstacles and verify fair collision
4. Ensure collisions feel fair and predictable

### Character Comparison
1. Play with Boss (easiest - largest hitbox)
2. Play with Pijamas (medium difficulty)
3. Play with Blue (hardest - smallest hitbox)
4. Verify difficulty scaling feels appropriate

---

## Technical Implementation

### Character Hitbox Pattern
```typescript
.setBodySize(width, height)           // Physics body size
.setSize(width, height)               // Display size (same)
.setOffset(x, onGroundPosition + y)  // Position adjustment
```

### Obstacle Hitbox Pattern
```typescript
const config = OBSTACLE_BODY_CONFIG[type];
const bodyWidth = displayWidth * config.body.widthRatio;
const bodyHeight = displayHeight * config.heightRatio;
const offsetX = displayWidth * config.body.offsetXRatio;
const offsetY = displayHeight - bodyHeight - (displayHeight * config.body.bottomPaddingRatio);

body.setSize(bodyWidth, bodyHeight);
body.setOffset(offsetX, offsetY);
```

### Ratio-Based Benefits
- Scales automatically with sprite size
- Easy to tune percentages
- Self-documenting (0.60 = 60% of sprite)
- Resolution-independent

---

## Future Tuning

If collision boxes need adjustment:

1. **Enable debug mode** (press 'P')
2. **Identify issue** (too tight? too loose?)
3. **Adjust ratios** in config files:
   - `DinoCharacter.ts` for characters
   - `ObstacleManager.ts` for obstacles
4. **Test in-game** with visualizer
5. **Iterate** until perfect

### Common Adjustments
- **Too easy:** Increase width/heightRatio by 0.05
- **Too hard:** Decrease width/heightRatio by 0.05
- **Offset issues:** Adjust offsetXRatio by 0.02 increments
- **Floating hitbox:** Increase bottomPaddingRatio
- **Grounded hitbox:** Decrease bottomPaddingRatio

---

## Summary

All collision boxes are now:
- ✅ Based on actual sprite analysis
- ✅ Exclude decorative elements
- ✅ Fair and predictable
- ✅ Visually verifiable with debug mode
- ✅ Balanced for difficulty scaling
- ✅ Easy to tune with ratio system

**Result:** Players can trust what they see - if it looks like they dodged it, they did!

---

**Last Updated:** October 10, 2025
**Debug Key:** Press 'P' during gameplay
**Next Review:** After community feedback on collision fairness
