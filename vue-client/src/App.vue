<template>
	<v-app>
		<v-app-bar color="#000000" v-if="store.user">
			<v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
			<v-app-bar-title>Premiumbikes</v-app-bar-title>
			<v-spacer />
			<h2 class="mr-4 hidden sm:block">{{ store.user.name }}</h2>
			<v-btn @click="logout()" variant="elevated" color="red">logout</v-btn>
		</v-app-bar>

		<v-navigation-drawer v-model="drawer" elevation="4" v-if="store.user"
			class="bg-gradient-to-t from-slate-800 via-slate-800 to-black">
			<div
				class="bg-gray-50 px-15 py-4 items-center space-x-4 border-b border-gray-400 bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">
				<v-avatar size="130" class="border-2 border-gray-400" color="primary">
					<v-img v-if="store.user.avatarUrl" width="130" alt="User avatar" referrerpolicy="no-referrer"
						:src="store.user.avatarUrl"></v-img>
					<span v-else class="text-h3">{{ initials }}</span>
				</v-avatar>
			</div>
			<div class="font-semibold text-md text-gray-200 transition-color duration-300 px-10 text-center">
				{{ store.user.name }}
			</div>
			<div class="font-semibold text-sm px-8 text-gray-200 text-center">
				{{ store.user.email }}
			</div>
			<v-list nav density="compact">
				<template v-if="store.isAdmin">
					<v-list-item class="Menu pa-4" style="color: #ffffff;" title="Motorcycle Master"
						to="/motorshopmaster" prepend-icon="mdi-security" />
					<v-list-item class="Menu pa-4" style="color: #ffffff;" title="Users Master"
						to="/usersmaster" prepend-icon="mdi-account-group-outline" />
				</template>
				<v-list-item class="Menu pa-4" style="color: #ffffff;" title="Motorcycle Shop" to="/usermotorcycle"
					prepend-icon="mdi-motorbike" />
				<v-list-item class="Menu pa-4" style="color: #ffffff;" title="My Orders" to="/myorders"
					prepend-icon="mdi-clipboard-list" />
			</v-list>
		</v-navigation-drawer>

		<v-main class="bg-gray-900">
			<v-container fluid>
				<router-view></router-view>
				<v-footer class="text-center d-flex flex-column ga-2 py-4 text-white" color="transparent">
					<div class="d-flex ga-3">
						<v-btn v-for="icon in icons" :key="icon" :icon="icon" density="comfortable"
							variant="text"></v-btn>
					</div>

					<v-divider class="my-2" thickness="2" width="50"></v-divider>

					<div>
						<strong>© 2025 Premiumbikes. All Rights Reserved.</strong>
					</div>
				</v-footer>
			</v-container>
		</v-main>
	</v-app>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMainStore } from './stores/mainStore';

const store = useMainStore();
const router = useRouter();
const drawer = ref(false);
const icons = ['mdi-facebook', 'mdi-twitter', 'mdi-linkedin', 'mdi-instagram'];

const initials = computed(() =>
	(store.user?.name || '?')
		.split(/\s+/)
		.slice(0, 2)
		.map((word) => word[0]?.toUpperCase())
		.join('')
);

async function logout() {
	await store.logout();
	router.push({ name: 'Login' });
}
</script>
