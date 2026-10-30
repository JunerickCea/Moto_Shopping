<template>
    <div class="flex justify-center px-2 sm:px-4 mt-4 sm:mt-12">
        <v-card width="440" max-width="100%" class="pa-4" style="border-radius: 8px">
            <div class="text-center mb-2">
                <v-icon size="56" color="primary">mdi-motorbike</v-icon>
                <h1 class="text-h5 font-weight-bold mt-2">Premiumbikes</h1>
            </div>
            <LoginForm @done="finish" />
        </v-card>
    </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';
import LoginForm from './LoginForm.vue';
import { useMainStore } from '../stores/mainStore';

const router = useRouter();
const route = useRoute();
const store = useMainStore();

// Only follow same-site paths from ?redirect=, never full URLs.
const safeRedirect = (value) => (typeof value === 'string' && /^\/(?!\/)/.test(value) ? value : null);

function finish(user) {
    store.setUser(user);
    router.push(safeRedirect(route.query.redirect) || (store.isAdmin ? { name: 'MotorShopMaster' } : { name: 'Dashboard' }));
}
</script>
