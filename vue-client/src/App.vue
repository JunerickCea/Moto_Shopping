<template>
	<v-app>
		<v-app-bar color="#000000" density="comfortable">
			<v-app-bar-nav-icon aria-label="Menu" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
			<v-app-bar-title>
				<router-link to="/" class="text-white">Premiumbikes</router-link>
			</v-app-bar-title>
			<template v-if="store.user">
				<span class="mr-3 text-subtitle-1 font-weight-bold d-none d-sm-inline">{{ store.user.name }}</span>
				<v-btn v-if="xs" icon="mdi-logout" color="red" aria-label="logout" @click="logout()" />
				<v-btn v-else @click="logout()" variant="elevated" color="red" class="mr-2">logout</v-btn>
			</template>
			<v-btn v-else-if="route.name !== 'Login'" variant="elevated" color="primary" prepend-icon="mdi-login"
				class="mr-2" @click="store.requireLogin()">Log in</v-btn>
		</v-app-bar>

		<v-navigation-drawer v-model="drawer" temporary elevation="4"
			class="bg-gradient-to-t from-slate-800 via-slate-800 to-black">
			<div v-if="store.user" class="pt-6 pb-2 text-center text-white border-b border-gray-600">
				<v-avatar size="96" class="border-2 border-gray-400" color="primary">
					<v-img v-if="store.user.avatarUrl" alt="User avatar" referrerpolicy="no-referrer"
						:src="store.user.avatarUrl"></v-img>
					<span v-else class="text-h4">{{ initials }}</span>
				</v-avatar>
				<div class="font-semibold text-md text-gray-200 mt-2 px-4">{{ store.user.name }}</div>
				<div class="text-sm px-4 text-gray-300 text-truncate">{{ store.user.email }}</div>
			</div>
			<div v-else class="pa-6 text-center text-white">
				<v-icon size="64" color="primary">mdi-motorbike</v-icon>
				<p class="mt-2 mb-4 text-gray-300">Log in to buy a motorcycle and track your orders.</p>
				<v-btn color="primary" block prepend-icon="mdi-login" @click="drawer = false; store.requireLogin()">Log
					in</v-btn>
			</div>
			<v-list nav density="compact">
				<v-list-item class="Menu pa-4" style="color: #ffffff;" title="Dashboard" to="/" exact
					prepend-icon="mdi-view-dashboard" />
				<v-list-item v-if="store.user" class="Menu pa-4" style="color: #ffffff;" title="My Orders"
					to="/myorders" prepend-icon="mdi-clipboard-list" />
				<template v-if="store.isAdmin">
					<v-list-item class="Menu pa-4" style="color: #ffffff;" title="Motorcycle Master"
						to="/motorshopmaster" prepend-icon="mdi-security" />
					<v-list-item class="Menu pa-4" style="color: #ffffff;" title="Users Master"
						to="/usersmaster" prepend-icon="mdi-account-group-outline" />
				</template>
			</v-list>
		</v-navigation-drawer>

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
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import LoginForm from './components/LoginForm.vue';
import { useMainStore } from './stores/mainStore';

const store = useMainStore();
const router = useRouter();
const route = useRoute();
const { xs } = useDisplay();
const drawer = ref(false);
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
