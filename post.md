# Color grading, Quake, and SoftPalette

I've always loved a really committed color palette — Ugly Betty's loud,
saturated optimism, or the dense forest greens and dusky blues of the [Tarzan
musical at Theater Liberi](https://theater-liberi.de/musicals/tarzan). The
palette isn't decoration there; it's part of how the story feels.

That fascination is what pulled me into a side project around Quake 1.

Quake 1 remasterings and engine ports each focus on different things — higher
resolution textures, dynamic lighting, modernised models, post effects.
*Which* Quake feels iconic depends on what part you grew up imagining. The
low-fi original left a lot of room for that imagination. For me, the palette
and the colour grading it forced onto the renderer is a huge part of the
feel.

For my own remastering project I wanted to keep that grading without
constraining the renderer (high-res textures, modern lights, post — all
welcome). That's a different problem from quantising back to 256 colours: I
don't want the 256-colour *look*, I want the *grading* that the 256-colour
palette produced.

That's what **SoftPalette** does. Drop in a palette, and it bakes a smooth 3D
LUT that replicates the look — pixels gravitate toward palette anchors where
the image already sits close to one, and blend continuously between them
everywhere else. No banding, no posterisation, no hard quantisation seams.

This is a reiteration of some earlier experiments, with the math rebuilt from
scratch — OkLab + anisotropic IDW + a per-hue envelope + a few safety nets
(happy to nerd out in the comments).

Live demo / source: <https://manuelkugelmann.github.io/SoftPalette/>

More dynamic, content-dependent methods will follow — gradings that adapt to
the scene without losing the palette's character.

#colorgrading #gamedev #shaders #quake #webgl #oklab
