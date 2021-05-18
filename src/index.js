import './styles/theme.scss';
import Vue from 'vue';
import App from './components/App.vue';

const body = document.getElementsByTagName('body')[0];
const app = document.createElement('div');
app.setAttribute('id', 'app');
body.insertBefore(app, body.firstChild);
new Vue({
    el: '#app',
    render: h => h(App),
});
