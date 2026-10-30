<template>
    <div class="flex justify-center px-4" style="margin-top: 4%">
        <v-card width="440" class="pa-4" style="border-radius: 8px">
            <div class="text-center mb-2">
                <v-icon size="56" color="primary">mdi-motorbike</v-icon>
                <h1 class="text-h5 font-weight-bold mt-2">Premiumbikes</h1>
            </div>

            <v-tabs v-model="tab" grow @update:model-value="error = ''">
                <v-tab value="login">Log in</v-tab>
                <v-tab value="register">Create account</v-tab>
            </v-tabs>

            <v-card-text>
                <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4" :text="error" />

                <v-form @submit.prevent="submit" ref="form">
                    <v-text-field v-if="tab === 'register'" v-model="name" label="Full name" variant="outlined"
                        prepend-inner-icon="mdi-account" autocomplete="name" :rules="[rules.required]" />
                    <v-text-field v-model="email" label="Email" type="email" variant="outlined"
                        prepend-inner-icon="mdi-email" autocomplete="email" :rules="[rules.required, rules.email]" />
                    <v-text-field v-model="password" label="Password" variant="outlined"
                        prepend-inner-icon="mdi-lock" :type="showPassword ? 'text' : 'password'"
                        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                        :autocomplete="tab === 'login' ? 'current-password' : 'new-password'"
                        :hint="tab === 'register' ? 'At least 8 characters' : ''"
                        :rules="tab === 'register' ? [rules.required, rules.minLength] : [rules.required]"
                        @click:append-inner="showPassword = !showPassword" />
                    <v-btn type="submit" color="primary" block size="large" :loading="loading">
                        {{ tab === 'login' ? 'Log in' : 'Create account' }}
                    </v-btn>
                </v-form>

                <template v-if="googleEnabled">
                    <div class="d-flex align-center my-4">
                        <v-divider /><span class="mx-3 text-caption text-medium-emphasis">or</span><v-divider />
                    </div>
                    <div ref="googleButton" class="d-flex justify-center"></div>
                </template>
            </v-card-text>
        </v-card>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api, { errorMessage } from '../services/api';
import { useMainStore } from '../stores/mainStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const googleEnabled = Boolean(GOOGLE_CLIENT_ID);

const router = useRouter();
const store = useMainStore();

const tab = ref('login');
const name = ref('');
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const form = ref(null);
const googleButton = ref(null);

const rules = {
    required: (v) => !!v || 'Required',
    email: (v) => /^\S+@\S+\.\S+$/.test(v) || 'Enter a valid email address',
    minLength: (v) => (v || '').length >= 8 || 'At least 8 characters',
};

function finish(user) {
    store.setUser(user);
    router.push({ name: store.isAdmin ? 'MotorShopMaster' : 'UserMotorcycle' });
}

async function submit() {
    const { valid } = await form.value.validate();
    if (!valid) return;
    loading.value = true;
    error.value = '';
    try {
        const body = tab.value === 'login'
            ? { email: email.value, password: password.value }
            : { name: name.value, email: email.value, password: password.value };
        const { data } = await api.post(`/auth/${tab.value === 'login' ? 'login' : 'register'}`, body);
        password.value = '';
        finish(data.user);
    } catch (err) {
        error.value = errorMessage(err);
    } finally {
        loading.value = false;
    }
}

async function onGoogleCredential({ credential }) {
    error.value = '';
    try {
        const { data } = await api.post('/auth/google', { credential });
        finish(data.user);
    } catch (err) {
        error.value = errorMessage(err);
    }
}

function loadGoogleScript() {
    if (window.google?.accounts?.id) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

onMounted(async () => {
    if (!googleEnabled) return;
    try {
        await loadGoogleScript();
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleCredential });
        window.google.accounts.id.renderButton(googleButton.value, { theme: 'outline', size: 'large', width: 320 });
    } catch {
        error.value = 'Google sign-in could not be loaded. You can still log in with your email.';
    }
});
</script>
