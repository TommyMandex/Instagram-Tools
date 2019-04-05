const Client = require('instagram-private-api').V1;
const delay = require('delay');
const chalk = require('chalk');
const _ = require('lodash');
const rp = require('request-promise');
const inquirer = require('inquirer');

const User = [
{
	type:'input',
	name:'username',
	message:'=> Insert Username:',
	validate: function(value){
		if(!value) return 'Can\'t Empty';
		return true;
	}
},
{
	type:'password',
	name:'password',
	message:'=> Insert Password:',
	mask:'*',
	validate: function(value){
		if(!value) return 'Can\'t Empty';
		return true;
	}
},
{
	type:'input',
	name:'sleep',
	message:'=> Insert Sleep (MiliSeconds):',
	validate: function(value){
		value = value.match(/[0-10000]/);
		if (value) return true;
		return 'Delay is number';
	}
}
]

const Login = async function(User){

	const Device = new Client.Device(User.username);
	const Storage = new Client.CookieMemoryStorage();
	const session = new Client.Session(Device, Storage);

	try {
		await Client.Session.create(Device, Storage, User.username, User.password)
		const account = await session.getAccount();
		return Promise.resolve({session,account});
	} catch (err) {
		return Promise.reject(err);
	}

}

const Followers = async function(session, id){
	const feed = new Client.Feed.AccountFollowers(session, id);
	try{
		const Pollowers = [];
		var cursor;
		do {
			if (cursor) feed.setCursor(cursor);
			const getPollowers = await feed.get();
			await Promise.all(getPollowers.map(async(akun) => {
				Pollowers.push(akun.id);
			}))
			cursor = await feed.getCursor();
		} while(feed.isMoreAvailable());
		return Promise.resolve(Pollowers);
	} catch(err){
		return Promise.reject(err);
	}
}

const Following = async function(session, id){
	const feed = new Client.Feed.AccountFollowing(session, id);
	try{
		const Pollowing = [];
		var cursor;
		do {
			if (cursor) feed.setCursor(cursor);
			const getPollowers = await feed.get();
			await Promise.all(getPollowers.map(async(akun) => {
				Pollowing.push(akun.id);
			}))
			cursor = await feed.getCursor();
		} while(feed.isMoreAvailable());
		return Promise.resolve(Pollowing);
	} catch(err){
		return Promise.reject(err);
	}
}

const Unfollow = async function(session, accountId){
	try {
		await Client.Relationship.destroy(session, accountId);
		return chalk`{bold.green TER-HAPUS}`;
	} catch (err){
		return chalk`{bold.red SYSYTEM FAILUR}`;
	}
}

const Excute = async function(User,sleep){
	try {
		console.log(chalk`\n{yellow [✓] Try to Login . . .}`);
		const doLogin = await Login(User);
		console.log(chalk`{green [!] SUCCESS LOGIN}, {yellow [√] TRY ....}`);
		const task = [
		Followers(doLogin.session, doLogin.account.id),
		Following(doLogin.session, doLogin.account.id)
		]
		const [getFollowers, getFollowing] = await Promise.all(task);
		console.log(chalk`{blue  | Followers : ${getFollowers.length}\n | Following : ${getFollowing.length}}`);
		var AccountToUnfollow = [];
		await Promise.all(getFollowing.map(async(account) => {
			if (!getFollowers.includes(account)) {
				await AccountToUnfollow.push(account);
			}
		}));
		console.log(chalk`{blue  | Account To UN-FOLLOW : ${AccountToUnfollow.length}}`)
		AccountToUnfollow = _.chunk(AccountToUnfollow, 10);
		for (let i = 0; i < AccountToUnfollow.length; i++) {
			var timeNow = new Date();
			timeNow = `${timeNow.getHours()}:${timeNow.getMinutes()}:${timeNow.getSeconds()}`
			await Promise.all(AccountToUnfollow[i].map(async(akun) => {
				const doUnfollow = await Unfollow(doLogin.session, akun);
				console.log(chalk`[{magenta ${timeNow}}] UN-FOLLOW => ID {blue [${akun}]} => ${doUnfollow}`);
			}))
			await console.log(chalk`{yellow \n ======> Delay For ${sleep} MiliSeconds\n}`);
			await delay(sleep);
		}
	} catch(err) {
		console.log(err);
	}
}

console.log(chalk`
{bold.red ======================================================================}
           [√] {bold.green AUTO UNFOLLOW INSTAGRAM Coded By Zio} [√]
{bold.cyan ======================================================================}
{bold.green [✓] => UN-Follow Instagram
[✓] => Thanks For Member All Obsidian Cyber Team
[✓] => Coded By X-G77Z10HACKED / Zio Alfino
[✓] => https://github.com/XG77Z10 }
{bold.red ======================================================================}
    `);

inquirer.prompt(User)
.then(answers => {
	Excute({
		username:answers.username,
		password:answers.password
	},answers.sleep);
})
