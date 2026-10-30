<template>
    <v-card class="bg-gradient-to-t from-slate-800 via-slate-800 to-black text-white">
        <v-card-title class="flex items-center border-b bg-black text-white">
            <v-icon>mdi-account-circle</v-icon>
            <h1 class="ml-2">My Profile</h1>
        </v-card-title>

        <v-container class="px-2 px-sm-4" style="max-width: 860px">
            <!-- Account -->
            <v-card class="bg-gray-700 text-white pa-4 pa-sm-6 mb-4">
                <div class="d-flex flex-wrap align-center ga-4">
                    <v-avatar size="72" color="primary">
                        <v-img v-if="user.avatarUrl" :src="user.avatarUrl" alt="Profile photo"
                            referrerpolicy="no-referrer" />
                        <span v-else class="text-h5">{{ initials }}</span>
                    </v-avatar>
                    <div class="min-w-0">
                        <div class="text-h6 font-weight-bold text-break">{{ user.name }}</div>
                        <div class="text-gray-300 text-break">{{ user.email }}</div>
                        <div class="d-flex flex-wrap ga-1 mt-2">
                            <v-chip v-if="user.hasPassword" size="small" prepend-icon="mdi-lock">Password</v-chip>
                            <v-chip v-if="user.hasGoogle" size="small" prepend-icon="mdi-google">Google</v-chip>
                            <v-chip v-if="user.role === 'Admin'" size="small" color="amber"
                                prepend-icon="mdi-shield-account">Admin</v-chip>
                        </div>
                    </div>
                </div>
                <p class="text-caption text-gray-400 mt-3">Your email is your login, so it can't be changed here.</p>
            </v-card>

            <!-- Delivery details -->
            <v-card class="bg-gray-700 text-white pa-4 pa-sm-6 mb-4">
                <h2 class="text-lg font-semibold mb-1"><v-icon class="mr-2">mdi-truck-delivery</v-icon>Delivery
                    details</h2>
                <p class="text-sm text-gray-300 mb-4">Saved here so checkout is filled in for you.</p>

                <v-alert v-if="details.message" :type="details.ok ? 'success' : 'error'" variant="tonal"
                    density="compact" class="mb-4" :text="details.message" />

                <v-form ref="detailsForm" @submit.prevent="saveDetails">
                    <v-row dense>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="form.name" label="Full name" variant="outlined" density="compact"
                                prepend-inner-icon="mdi-account" autocomplete="name" counter="100" maxlength="100"
                                :rules="[(v) => !!(v || '').trim() || 'Name is required']" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="form.contactNo" label="Contact number" variant="outlined"
                                density="compact" prepend-inner-icon="mdi-cellphone" autocomplete="tel"
                                inputmode="tel" counter="30" maxlength="30" placeholder="0917 123 4567" />
                        </v-col>
                        <v-col cols="12">
                            <v-textarea v-model="form.address" label="Delivery address" variant="outlined"
                                density="compact" prepend-inner-icon="mdi-map-marker" autocomplete="street-address"
                                rows="2" auto-grow counter="300" maxlength="300"
                                placeholder="House no., street, barangay, city, province" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-select v-model="form.paymentMethod" label="Preferred payment method"
                                variant="outlined" density="compact" prepend-inner-icon="mdi-credit-card-outline"
                                :items="PAYMENT_METHODS" clearable />
                        </v-col>
                    </v-row>
                    <div class="d-flex">
                        <v-spacer />
                        <v-btn type="submit" color="primary" variant="elevated" prepend-icon="mdi-content-save"
                            :loading="details.saving">Save details</v-btn>
                    </div>
                </v-form>
            </v-card>

            <!-- Password -->
            <v-card class="bg-gray-700 text-white pa-4 pa-sm-6">
                <h2 class="text-lg font-semibold mb-3"><v-icon class="mr-2">mdi-lock-reset</v-icon>Password</h2>

                <v-alert v-if="!user.hasPassword" type="info" variant="tonal" density="compact"
                    text="You sign in with Google, so there is no password to change here." />

                <template v-else>
                    <v-alert v-if="password.message" :type="password.ok ? 'success' : 'error'" variant="tonal"
                        density="compact" class="mb-4" :text="password.message" />
                    <v-form ref="passwordForm" @submit.prevent="changePassword">
                        <v-row dense>
                            <v-col cols="12">
                                <v-text-field v-model="password.current" label="Current password"
                                    variant="outlined" density="compact" prepend-inner-icon="mdi-lock"
                                    :type="password.show ? 'text' : 'password'" autocomplete="current-password"
                                    :append-inner-icon="password.show ? 'mdi-eye-off' : 'mdi-eye'"
                                    @click:append-inner="password.show = !password.show"
                                    :rules="[(v) => !!v || 'Enter your current password']" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="password.next" label="New password" variant="outlined"
                                    density="compact" prepend-inner-icon="mdi-lock-plus"
                                    :type="password.show ? 'text' : 'password'" autocomplete="new-password"
                                    hint="At least 8 characters"
                                    :rules="[(v) => (v || '').length >= 8 || 'At least 8 characters']" />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field v-model="password.confirm" label="Confirm new password"
                                    variant="outlined" density="compact" prepend-inner-icon="mdi-lock-check"
                                    :type="password.show ? 'text' : 'password'" autocomplete="new-password"
                                    :rules="[(v) => v === password.next || 'Passwords do not match']" />
                            </v-col>
                        </v-row>
                        <div class="d-flex">
                            <v-spacer />
                            <v-btn type="submit" color="primary" variant="elevated" prepend-icon="mdi-lock-reset"
                                :loading="password.saving">Change password</v-btn>
                        </div>
                    </v-form>
                </template>
            </v-card>
        </v-container>
    </v-card>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import api, { errorMessage } from '../services/api';
import { useMainStore } from '../stores/mainStore';
import { PAYMENT_METHODS } from '../utils/format';

const store = useMainStore();
const user = computed(() => store.user);

const initials = computed(() =>
    (user.value?.name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join(''));

const form = reactive({
    name: user.value.name,
    contactNo: user.value.contactNo,
    address: user.value.address,
    paymentMethod: user.value.paymentMethod,
});
const detailsForm = ref(null);
const details = reactive({ saving: false, message: '', ok: true });

const passwordForm = ref(null);
const password = reactive({ current: '', next: '', confirm: '', show: false, saving: false, message: '', ok: true });

async function saveDetails() {
    const { valid } = await detailsForm.value.validate();
    if (!valid) return;
    details.saving = true;
    details.message = '';
    try {
        const { data } = await api.put('/profile', { ...form, paymentMethod: form.paymentMethod || null });
        store.setUser(data.user);
        details.ok = true;
        details.message = 'Your details were saved. Checkout will be filled in with them.';
    } catch (err) {
        details.ok = false;
        details.message = errorMessage(err);
    } finally {
        details.saving = false;
    }
}

async function changePassword() {
    const { valid } = await passwordForm.value.validate();
    if (!valid) return;
    password.saving = true;
    password.message = '';
    try {
        await api.put('/profile/password', { currentPassword: password.current, newPassword: password.next });
        password.current = '';
        password.next = '';
        password.confirm = '';
        passwordForm.value.resetValidation();
        password.ok = true;
        password.message = 'Password changed. You were signed out on your other devices.';
    } catch (err) {
        password.ok = false;
        password.message = errorMessage(err);
    } finally {
        password.saving = false;
    }
}
</script>

<style scoped>
.min-w-0 {
    min-width: 0;
}
</style>
