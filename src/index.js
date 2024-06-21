import './styles/theme.scss';
import Vue from 'vue';
import App from './components/App.vue';

import Plausible from 'plausible-tracker';
Plausible({
    domain: 'cemulate.github.io/oracles-randomizer-web',
    apiHost: 'https://plausible.351321.xyz',
}).enableAutoPageviews();

const body = document.getElementsByTagName('body')[0];
const app = document.createElement('div');
app.setAttribute('id', 'app');
body.insertBefore(app, body.firstChild);
new Vue({
    el: '#app',
    render: h => h(App),
});
