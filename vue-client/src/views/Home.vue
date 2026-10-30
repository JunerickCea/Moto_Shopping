<template>
  <div class="d-flex flex-column ga-6">
    <UserMotorcycle />
    <FeedbackSection />
    <ShopLocation />
  </div>
</template>

<script setup>
import UserMotorcycle from '../components/MasterMaintenance/UserMotorcycle.vue';
import FeedbackSection from '../components/Dashboard/FeedbackSection.vue';
import ShopLocation from '../components/Dashboard/ShopLocation.vue';
</script>
