<template>
    <v-card class="bg-gray-700 text-white py-3">
        <div class="d-flex align-center px-4 pb-2">
            <v-icon class="mr-2 text-yellow-500" size="small">mdi-trophy</v-icon>
            <span class="text-sm font-semibold uppercase tracking-wide text-gray-300">Top brands in the Philippines</span>
        </div>
        <div class="marquee" aria-label="Popular motorcycle brands in the Philippines">
            <!-- Rendered twice so the loop is seamless; the copy is hidden from screen readers and the keyboard -->
            <div class="marquee__track">
                <ul v-for="copy in 2" :key="copy" class="marquee__list" :aria-hidden="copy === 2 ? 'true' : null">
                    <li v-for="(brand, i) in loop" :key="`${brand.name}-${i}`">
                        <component :is="stockedName(brand) ? 'button' : 'div'" class="brand"
                            :class="{ 'brand--stocked': stockedName(brand) }"
                            :type="stockedName(brand) ? 'button' : null"
                            :tabindex="stockedName(brand) ? (copy === 1 && i < brands.length ? 0 : -1) : null"
                            :title="stockedName(brand) ? `Show ${brand.name} motorcycles` : brand.name"
                            @click="stockedName(brand) && $emit('select', stockedName(brand))">
                            <img :src="brand.logo" :alt="brand.name" class="brand__logo" width="48" height="48"
                                draggable="false">
                            <span class="brand__name">
                                {{ brand.name }}
                                <span v-if="stockedName(brand)" class="brand__dot" aria-hidden="true"></span>
                                <span v-if="stockedName(brand)" class="sr-only">(in our shop)</span>
                            </span>
                        </component>
                    </li>
                </ul>
            </div>
        </div>
        <p class="sr-only">Brand logos are trademarks of their respective owners.</p>
    </v-card>
</template>

<script setup>
// Logos from Simple Icons (CC0, simpleicons.org). Brand marks remain trademarks of their owners.
import honda from '../../assets/brands/honda.svg';
import yamaha from '../../assets/brands/yamaha.svg';
import suzuki from '../../assets/brands/suzuki.svg';
import ktm from '../../assets/brands/ktm.svg';
import ducati from '../../assets/brands/ducati.svg';
import bmw from '../../assets/brands/bmw.svg';
import vespa from '../../assets/brands/vespa.svg';

// `match` lists the names the catalog might use for the brand (compared case-insensitively).
const brands = [
    { name: 'Honda', logo: honda, match: ['honda'] },
    { name: 'Yamaha', logo: yamaha, match: ['yamaha'] },
    { name: 'Suzuki', logo: suzuki, match: ['suzuki'] },
    { name: 'KTM', logo: ktm, match: ['ktm'] },
    { name: 'Ducati', logo: ducati, match: ['ducati'] },
    { name: 'BMW Motorrad', logo: bmw, match: ['bmw', 'bmw motorrad'] },
    { name: 'Vespa', logo: vespa, match: ['vespa', 'piaggio'] },
];
// Seven logos are narrower than a wide screen, so repeat them to keep the band full while it loops.
const loop = [...brands, ...brands, ...brands];

// Brands the shop currently sells (from the catalog); those logos are clickable and filter the list.
const props = defineProps({ stockedBrands: { type: Array, default: () => [] } });
defineEmits(['select']);

const stockedName = (brand) => props.stockedBrands.find((b) => brand.match.includes(b.toLowerCase()));
</script>

<style scoped>
.marquee {
    overflow: hidden;
    /* Soft fade at both edges */
    -webkit-mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
    mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
}

.marquee__track {
    display: flex;
    width: max-content;
    animation: marquee 45s linear infinite;
}

.marquee:hover .marquee__track,
.marquee:active .marquee__track,
.marquee:focus-within .marquee__track {
    animation-play-state: paused;
}

.marquee__list {
    display: flex;
    gap: 8px;
    padding: 4px 4px;
    margin: 0;
    list-style: none;
}

.brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 132px;
    padding: 10px 8px;
    border-radius: 12px;
    background: none;
    border: 0;
    color: inherit;
    user-select: none;
}

/* Monochrome logos like a sponsor strip: muted at rest, bright on hover */
.brand__logo {
    width: 48px;
    height: 48px;
    filter: invert(1);
    opacity: 0.6;
    transition: opacity 0.2s, transform 0.2s;
}

.brand__name {
    display: inline-flex;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    color: rgb(203, 213, 225);
}

.brand--stocked {
    cursor: pointer;
}

.brand--stocked .brand__logo {
    opacity: 0.85;
}

.brand:hover .brand__logo,
.brand--stocked:focus-visible .brand__logo {
    opacity: 1;
    transform: scale(1.08);
}

.brand--stocked:hover,
.brand--stocked:focus-visible {
    background: rgba(255, 255, 255, 0.08);
    outline: none;
}

.brand__dot {
    width: 7px;
    height: 7px;
    margin-left: 6px;
    border-radius: 50%;
    background: #4caf50;
}

@keyframes marquee {
    from {
        transform: translateX(0);
    }

    to {
        transform: translateX(-50%);
    }
}

/* Respect "reduce motion": no auto-scroll, let people swipe through the brands instead */
@media (prefers-reduced-motion: reduce) {
    .marquee {
        overflow-x: auto;
    }

    .marquee__track {
        animation: none;
    }
}
</style>
