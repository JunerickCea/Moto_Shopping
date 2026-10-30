<template>
	<v-app>
		<!-- Top navigation: labels on wider screens, icons (with tooltips) on phones -->
		<v-app-bar color="#000000" density="comfortable">
			<router-link to="/" class="d-flex align-center text-white ml-3 ml-sm-4 mr-2" aria-label="Premiumbikes home">
				<v-icon color="primary" size="30">mdi-motorbike</v-icon>
				<span class="ml-2 text-h6 font-weight-bold d-none d-sm-inline">Premiumbikes</span>
			</router-link>
			<v-spacer />

			<nav class="d-flex align-center ga-1" aria-label="Main">
				<template v-for="link in navLinks" :key="link.to">
					<v-btn v-if="compact" :to="link.to" :exact="link.exact" :icon="link.icon" variant="text"
						:aria-label="link.title" class="nav-btn">
						<v-icon>{{ link.icon }}</v-icon>
						<v-tooltip activator="parent" location="bottom">{{ link.title }}</v-tooltip>
					</v-btn>
					<v-btn v-else :to="link.to" :exact="link.exact" :prepend-icon="link.icon" variant="text"
						class="nav-btn text-none">{{ link.title }}</v-btn>
				</template>
			</nav>

			<v-menu v-if="store.user" location="bottom end" offset="8">
				<template #activator="{ props }">
					<v-btn v-bind="props" icon variant="text" class="mx-1 mr-sm-3" aria-label="Account menu">
						<v-avatar size="36" color="primary">
							<v-img v-if="store.user.avatarUrl" alt="" referrerpolicy="no-referrer"
								:src="store.user.avatarUrl" />
							<span v-else class="text-subtitle-2 font-weight-bold">{{ initials }}</span>
						</v-avatar>
					</v-btn>
				</template>
				<v-list density="compact" min-width="240">
					<v-list-item :title="store.user.name" :subtitle="store.user.email" class="pb-2" />
					<v-divider />
					<v-list-item to="/myorders" prepend-icon="mdi-clipboard-list" title="My Orders" />
					<v-list-item to="/profile" prepend-icon="mdi-account-circle" title="My Profile" />
					<v-divider />
					<v-list-item prepend-icon="mdi-logout" title="Log out" base-color="red" @click="logout()" />
				</v-list>
			</v-menu>
			<v-btn v-else-if="route.name !== 'Login'" variant="elevated" color="primary" prepend-icon="mdi-login"
				class="mx-2 mr-sm-3" @click="store.requireLogin()">Log in</v-btn>
		</v-app-bar>

		<v-main class="bg-gray-900">
			<v-container fluid class="px-2 px-sm-4">
				<router-view></router-view>
				<v-footer class="text-center d-flex flex-column ga-2 py-4 text-white" color="transparent">
					<div class="d-flex ga-3">
						<v-btn v-for="icon in icons" :key="icon" :icon="icon" density="comfortable"
							variant="text"></v-btn>
					</div>

					<v-divider class="my-2" thickness="2" width="50"></v-divider>

					<div>
						<strong>© {{ year }} Premiumbikes. All Rights Reserved.</strong>
					</div>
				</v-footer>
			</v-container>
		</v-main>

		<!-- Opened by store.requireLogin() when a guest tries to add to cart or check out -->
		<v-dialog :model-value="store.loginDialog" @update:model-value="(open) => !open && store.cancelLogin()"
			max-width="460" :fullscreen="xs" scrollable>
			<v-card class="pa-4">
				<div class="d-flex align-center mb-2">
					<v-icon color="primary" class="mr-2">mdi-motorbike</v-icon>
					<h2 class="text-h6 font-weight-bold">Log in to continue</h2>
					<v-spacer />
					<v-btn icon="mdi-close" variant="text" aria-label="Close" @click="store.cancelLogin()" />
				</div>
				<LoginForm v-if="store.loginDialog" @done="store.completeLogin" />
			</v-card>
		</v-dialog>
	</v-app>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import LoginForm from './components/LoginForm.vue';
import { useMainStore } from './stores/mainStore';

const store = useMainStore();
const router = useRouter();
const route = useRoute();
const { xs, mdAndDown } = useDisplay();

const navLinks = computed(() => [
	{ title: 'Shop', to: '/', icon: 'mdi-storefront', exact: true },
	...(store.user ? [{ title: 'My Orders', to: '/myorders', icon: 'mdi-clipboard-list' }] : []),
	...(store.isAdmin ? [
		{ title: 'Motorcycle Master', to: '/motorshopmaster', icon: 'mdi-security' },
		{ title: 'Users Master', to: '/usersmaster', icon: 'mdi-account-group-outline' },
	] : []),
]);
// Admins have four links, so they switch to icons a size earlier than customers.
const compact = computed(() => (store.isAdmin ? mdAndDown.value : xs.value));
const icons = ['mdi-facebook', 'mdi-twitter', 'mdi-linkedin', 'mdi-instagram'];
const year = new Date().getFullYear();

const initials = computed(() =>
	(store.user?.name || '?')
		.split(/\s+/)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase())
		.join('')
);

async function logout() {
	await store.logout();
	router.push({ name: 'Dashboard' });
}
</script>

<style scoped>
/* Highlight the page you are on */
.nav-btn.v-btn--active {
	color: rgb(var(--v-theme-primary)) !important;
}
</style>
