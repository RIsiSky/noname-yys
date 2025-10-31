import { lib, game, ui, get, ai, _status } from "../../noname.js";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	打断: {
		trigger: {
			player: "damageEnd",
		},
		content: function () {
			"step 0";
			player.draw(trigger.num);
			var cards = Array.from(ui.ordering.childNodes);
			while (cards.length) {
				cards.shift().discard();
			}
			("step 1");
			var nexts = trigger.next.slice();
			for (var next of nexts) {
				trigger.next.remove(next);
			}
			("step 2");
			player.insertPhase("打断");
			("step 3");
			var evt = _status.event.getParent(1, true);
			for (var i = 0; i <= 20; i++) {
				if (evt) {
					evt.finish();
					evt.untrigger(true);
					if (evt.name == "phase") {
						game.resetSkills();
						break;
					} else evt = evt.getParent(1, true);
				} else break;
			}
		},
		_priority: 0,
	},
	白板: {
		unique: true,
		limited: true,
		position: "he",
		mark: true,
		intro: {
			content: "limited",
		},
		skillAnimation: true,
		init: function (player) {
			//初始化
			player.storage.白板 = false; //技能未发动(xx为技能名)
		},
		check: function (event, player) {
			return true;
		},
		filter: function (event, player) {
			//发动限制条件
			return player.storage.白板 == false; //你没发动过这个技能
		},
		filterCard: function (card) {
			var suit = get.suit(card);
			for (var i = 0; i < ui.selected.cards.length; i++) {
				if (get.suit(ui.selected.cards[i]) == suit) return false;
			}
			return true;
		},
		selectCard: 4,
		complexCard: true,
		enable: "phaseUse",
		content: function () {
			"step 0";
			player.storage.白板 = true; //技能发动过
			player.awakenSkill("白板");
			player.chooseTarget(2).ai = function (target) {
				var player = _status.event.player;
				if (player == target) return get.attitude(player, target) + 10;
				return -get.attitude(player, target) + Math.random();
			};
			("step 1");
			var target = result.targets[0],
				target2 = result.targets[1];
			var name1 = target.name,
				name2 = target2.name;
			target.init(name2);
			target2.init(name1);
			player.gainMaxHp();
			player.recover();
			player.draw(4);
			if (target.identity == "zhu") {
				target.gainMaxHp();
				target.recover();
			}
			if (target2.identity == "zhu") {
				target2.gainMaxHp();
				target2.recover();
			}
		},
		ai: {
			order: 9,
			threaten: 3,
			expose: 0.4,
			result: {
				player: 4,
				target: -1,
			},
		},
		_priority: 0,
	},
	集星: {
		trigger: {
			player: "phaseDrawBegin1",
		},
		marktext: "星",
		notemp: true,
		locked: false,
		preHidden: true,
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
		content: function () {
			"step 0";
			var cards = get.cards(4);
			game.cardsGotoOrdering(cards);
			var next = player.chooseToMove("集星：将两张牌置于武将牌上，称为“星”", true);
			next.set("list", [["牌堆顶", cards], ["武将牌上"]]);
			next.set("filterMove", function (from, to, moved) {
				if (player.getExpansions("集星").length == 4) return false;
				if (to == 1 && (moved[1].length >= 2 || player.getExpansions("集星").length + moved[1].length >= 4)) return false;
				return true;
			});
			("step 1");
			var top = result.moved[0];
			var bottom = result.moved[1];
			top.reverse();
			for (var i = 0; i < top.length; i++) {
				ui.cardPile.insertBefore(top[i], ui.cardPile.firstChild);
			}
			if (bottom.length) {
				player.addToExpansion(bottom, player, "draw").gaintag.add("集星");
			}
			game.updateRoundNumber();
			game.delayx();
			//player.syncStorage("jixing");
		},
		mod: {
			maxHandcard: function (player, num) {
				return num + player.getExpansions("集星").length;
			},
		},
		onremove: function (player, skill) {
			var cards = player.getExpansions(skill);
			if (cards.length) player.loseToDiscardpile(cards);
		},
		_priority: 0,
	},
	攒星: {
		trigger: {
			player: "damageEnd",
		},
		filter: function (event) {
			return event.num > 0;
		},
		content: function () {
			"step 0";
			event.count = trigger.num;
			("step 1");
			event.count--;
			player.draw();
			("step 2");
			if (player.countCards("h") && player.getExpansions("集星").length < 4) {
				player.chooseCard("将一张手牌置于武将牌上作为“星”", true);
			}
			("step 3");
			if (result.cards && result.cards.length) {
				player.addToExpansion(result.cards, player, "draw").gaintag.add("集星");
			}
			("step 4");
			if (!player.countCards("h")) player.draw();
			("step 5");
			if (event.count > 0) {
				player.chooseBool(get.prompt2("攒星")).set("攒星");
			} else event.finish();
			("step 6");
			if (result.bool) {
				player.logSkill("zanxing");
				event.goto(1);
			}
		},
		_priority: 0,
	},
	星沉: {
		enable: "phaseUse",
		usable: 1,
		filter: function (event, player) {
			return player.getExpansions("集星").length > 0;
		},
		content: function () {
			"step 0";
			player.chooseButton(["请选择要弃置的同类型的牌", player.getExpansions("集星")], [1, player.getExpansions("集星").length], true).set("filterButton", function (button) {
				if (ui.selected.buttons.length) return get.type(button.link) == get.type(ui.selected.buttons[0].link);
				else return true;
			});
			("step 1");
			if (result.bool) {
				player.storage.xingchennum = result.links.length;
				player.storage.xingchen = get.type(result.links[0]);
				player.loseToDiscardpile(result.links);
				event.cards = get.cards(player.storage.xingchennum * 3);
				game.cardsGotoOrdering(event.cards);
				event.videoId = lib.status.videoId++;
				game.broadcastAll(
					function (player, id, cards) {
						var str;
						if (player == game.me && !_status.auto) {
							str = "展示牌堆顶三倍于你弃置的牌，并选择获得其中与弃置牌类型相同或不同的牌";
						} else {
							str = "展示牌堆顶三倍于你弃置的牌";
						}
						var dialog = ui.create.dialog(str, cards);
						dialog.videoId = id;
					},
					player,
					event.videoId,
					event.cards
				);
				event.time = get.utc();
				game.addVideo("showCards", player, ["展示牌堆顶五张牌", get.cardsInfo(event.cards)]);
				game.addVideo("delay", null, 2);
			} else event.finish();
			("step 2");
			var next = player.chooseButton([1, player.storage.xingchennum * 2], true);
			next.set("dialog", event.videoId);
			next.set("filterButton", function (button) {
				if (ui.selected.buttons.length) {
					if (get.type(ui.selected.buttons[0].link) == player.storage.xingchen) return get.type(button.link, false) == player.storage.xingchen;
					else return get.type(button.link, false) != player.storage.xingchen;
				}
				return true;
			});
			next.set("ai", function (button) {
				return get.value(button.link, _status.event.player);
			});
			("step 3");
			if (result.bool && result.links) {
				event.cards2 = result.links;
			} else {
				event.finish();
			}
			var time = 1000 - (get.utc() - event.time);
			if (time > 0) {
				game.delay(0, time);
			}
			("step 4");
			game.broadcastAll("closeDialog", event.videoId);
			var cards2 = event.cards2;
			player.gain(cards2, "log", "gain2");
		},
		_priority: 0,
	},
	mrliuzhuan: {
		trigger: {
			player: "loseHpAfter",
		},
		mark: true,
		forced: true,
		init: function (player) {
			player.storage.mrliuzhuan = 1;
			player.storage.mrliuzhuan_season = 1;
			game.addVideo("storage", player, ["mrliuzhuan", player.storage.mrliuzhuan]);
			player.addMark("mrliuzhuan_dying");
		},
		content: function () {
			player.changeHujia();
		},
		marktext: "流",
		intro: {
			content: function (storage) {
				return "当前共有" + storage + "个【四季流转】标记";
			},
		},
		group: ["mrliuzhuan_dying", "mrliuzhuan_spring", "mrliuzhuan_summer", "mrliuzhuan_fall", "mrliuzhuan_winter"],
		subSkill: {
			dying: {
				trigger: {
					player: "dyingBefore",
				},
				forced: true,
				content: function () {
					"step 0";
					if (player.hp > 0 || !player.storage.mrliuzhuan) event.finish();
					("step 1");
					player.recover();
					player.storage.mrliuzhuan--;
					game.addVideo("storage", player, ["mrliuzhuan", player.storage.mrliuzhuan]);
					event.goto(0);
				},
				marktext: "季",
				intro: {
					name: "四季",
					content: function (storage, player) {
						let str = ["春", "夏", "秋", "冬"];
						return "当前季节：" + str[player.storage.mrliuzhuan_season - 1];
					},
					markcount: function () {
						return 0;
					},
				},
				sub: true,
				sourceSkill: "mrliuzhuan",
				_priority: 0,
			},
			spring: {
				trigger: {
					player: "damageEnd",
					source: "damageEnd",
				},
				filter: function (event, player) {
					return player.storage.mrliuzhuan_season == 1;
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseTarget(true, [1, player.storage.mrliuzhuan])
						.set("prompt2", "是否发动【流转】：当你受到或造成伤害后，你可以令至多" + get.cnNumber(player.storage.mrliuzhuan) + "名角色回复一点体力并摸一张牌。若只选择了一名角色，其摸两张牌。然后你摸一张牌并失去一点体力，切换季节为夏")
						.set("ai", function (target) {
							var player = _status.event.player;
							if (player.hp + player.countCards("h") < 10) {
								if (player == target) return get.attitude(player, target) + 10;
								else return -1;
							} else {
								if (player == target) return get.attitude(player, target) + 10;
								else return get.attitude(player, target);
							}
						})
						.forResult();
				},
				async content(event, trigger, player) {
					var targets = event.targets;
					var l = targets.length;
					if (l == 1) {
						await targets[0].recover();
						await targets[0].draw(2);
					} else {
						for (var i = 0; i < l; i++) {
							await targets[i].recover();
							await targets[i].draw();
						}
					}
					await player.draw();
					await player.loseHp();
					player.storage.mrliuzhuan_season = 2;
					player.changeSkin({ characterName: "mr_ji" }, "mr_ji_summer");
				},
			},
			summer: {
				trigger: {
					player: "damageBefore",
					source: "damageBefore",
				},
				filter: function (event, player) {
					return player.storage.mrliuzhuan_season == 2;
				},
				async content(event, trigger, player) {
					if (trigger.source == player) trigger.num = trigger.num + player.storage.mrliuzhuan;
					else {
						if (trigger.num - player.storage.mrliuzhuan >= 0) trigger.num = trigger.num - player.storage.mrliuzhuan;
						else trigger.num = 0;
					}
					player.loseHp();
					player.storage.mrliuzhuan_season = 3;
					player.changeSkin({ characterName: "mr_ji" }, "mr_ji_fall");
				},
				prompt2: function (event, player) {
					return "是否发动【流转】：当你造成伤害时，你可以令该伤害加" + get.cnNumber(player.storage.mrliuzhuan) + ";当你受到伤害时，你可以令该伤害减" + get.cnNumber(player.storage.mrliuzhuan) + "，然后你失去一点体力，切换季节为秋";
				},
				_priority: 0,
			},
			fall: {
				trigger: {
					player: "damageEnd",
					source: "damageEnd",
				},
				filter: function (event, player) {
					return player.storage.mrliuzhuan_season == 3;
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseCardTarget({
							position: "he",
							selectCard: 1,
							selectTarget: [1, player.storage.mrliuzhuan],
							prompt2: "是否发动【流转】：当你受到或造成伤害后，你可以弃置一张牌令至多" + get.cnNumber(player.storage.mrliuzhuan) + "名角色的技能失效至其回合结束，然后你失去一点体力，切换季节为冬",
							ai1(card) {
								return 7 - get.value(card);
							},
							ai2(target) {
								var player = _status.event.player;
								return -get.attitude(player, target);
							},
						})
						.forResult();
				},
				async content(event, trigger, player) {
					let targets = event.targets,
						cards = event.cards;
					await player.discard(cards);
					var l = targets.length;
					for (var i = 0; i < l; i++) {
						await targets[i].addTempSkill("baiban", { player: "phaseAfter" });
						await targets[i].draw();
					}
					await player.loseHp();
					player.storage.mrliuzhuan_season = 4;
					player.changeSkin({ characterName: "mr_ji" }, "mr_ji_winter");
				},
			},
			winter: {
				trigger: {
					player: "damageBefore",
					source: "damageBefore",
				},
				filter: function (event, player) {
					return player.storage.mrliuzhuan_season == 4;
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseTarget([1, player.storage.mrliuzhuan])
						.set("prompt2", "是否发动【流转】：当你受到或造成伤害时，你可以令至多" + get.cnNumber(player.storage.mrliuzhuan) + "名角色造成的伤害减一直到其下个回合开始，然后你失去一点体力，切换季节为春")
						.set("ai", function (target) {
							var player = _status.event.player;
							return -get.attitude(player, target);
						})
						.forResult();
				},
				async content(event, trigger, player) {
					var targets = event.targets;
					var l = targets.length;
					for (var i = 0; i < l; i++) {
						var target = targets[i];
						await target.addTempSkill("mrliuzhuan_winter2", { player: "phaseAfter" });
					}
					player.storage.mrliuzhuan++;
					await player.loseHp();
					player.storage.mrliuzhuan_season = 1;
					player.changeSkin({ characterName: "mr_ji" }, "mr_ji_spring");
				},
			},
			winter2: {
				mark: true,
				forced: true,
				trigger: {
					source: "damageBegin",
				},
				alter: true,
				content: function () {
					if (trigger.num > 0) trigger.num--;
				},
				intro: {
					content: function () {
						var str = "你造成的伤害减一";
						return str;
					},
				},
				marktext: "雪",
			},
		},
		_priority: 0,
	},
	mryingyu: {
		forced: true,
		usable: 1,
		mod: {
			ignoredHandcard: function (card, player) {
				if (get.number(card, player) > 10 || get.number(card, player) == 1) return true;
			},
			cardDiscardable: function (card, player, name) {
				if (name == "phaseDiscard" && (get.number(card, player) > 10 || get.number(card, player) == 1)) return false;
			},
		},
		trigger: {
			global: "useCard",
		},
		filter: function (event, player) {
			if (event.player == player) return false;
			if (get.number(event.card) > 10 || get.number(event.card) == 1) return true;
		},
		content: function () {
			player.gain(trigger.cards, "gain2");
			trigger.targets.length = 0;
			trigger.all_excluded = true;
		},
		group: ["mryingyu_gaind", "mryingyu_shangxian"],
		subSkill: {
			gaind: {
				forced: true,
				trigger: {
					global: "loseAfter",
				},
				direct: true,
				filter: function (event, player) {
					if (event.type != "discard" || event.getlx === false) return false;
					var cards = event.cards.slice(0);
					var evt = event.getl(player);
					if (evt && evt.cards) cards.removeArray(evt.cards);
					for (var i = 0; i < cards.length; i++) {
						if (cards[i].original != "j" && (get.number(cards[i], event.player) > 10 || get.number(cards[i], event.player) == 1) && get.position(cards[i], true) == "d") {
							return true;
						}
					}
					return false;
				},
				content: function () {
					"step 0";
					if (trigger.delay == false) game.delay();
					("step 1");
					var cards = [],
						cards2 = trigger.cards.slice(0),
						evt = trigger.getl(player);
					if (evt && evt.cards) cards2.removeArray(evt.cards);
					for (var i = 0; i < cards2.length; i++) {
						if (cards2[i].original != "j" && (get.number(cards2[i], trigger.player) > 10 || get.number(cards2[i], trigger.player) == 1) && get.position(cards2[i], true) == "d") {
							cards.push(cards2[i]);
						}
					}
					player.logSkill("mryingyu");
					player.gain(cards, "gain2", "log");
				},
				sub: true,
				sourceSkill: "mryingyu",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrguicai: {
		enable: ["chooseToUse", "chooseToRespond"],
		usable: 1,
		prompt: "将一张英语牌当做任意牌使用或打出",
		filter: function (event, player) {
			if (player.countCards("hes", { number: [1, 11, 12, 13] })) return true;
		},
		chooseButton: {
			dialog: function () {
				var list = lib.inpile.filter(function (i) {
					var type = get.type(i);
					if (type == "basic" || type == "trick") return true;
					return false;
				});
				return ui.create.dialog([list, "vcard"]);
			},
			filter: function (button, event) {
				var evt = _status.event.getParent(),
					player = _status.event.player;
				return evt.filterCard({ name: button.link[2] }, player, evt);
			},
			backup: function (links, player) {
				return {
					selectCard: 1,
					filterCard: function (card) {
						return get.number(card) > 10 || get.number(card) == 1;
					},
					complexCard: true,
					position: "hes",
					viewAs: {
						name: links[0][2],
					},
					onuse: function () {
						player.draw();
					},
				};
			},
			prompt: function (links, player) {
				return "请选择" + get.translation(links[0][2]) + "的目标";
			},
		},
		hiddenCard: function (player, name) {
			if (name == "wuxie" && _status.connectMode && player.countCards("hes") > 0) return true;
			if (name == "wuxie") return player.countCards("hes") > 0;
			if (name == "tao") return player.countCards("hes") > 0;
		},
		_priority: 0,
	},
	mrleguan: {
		mark: true,
		init: function (player) {
			player.storage.mrleguan = player.hp + (player.identity == "zhu") + 1;
		},
		marktext: "乐",
		intro: {
			content: function (storage) {
				return "当前乐观值为" + storage;
			},
		},
		mod: {
			maxHandcard: function (player, num) {
				return (num += player.storage.mrleguan);
			},
		},
		group: ["mrleguan_shoushang", "mrleguan_kouxue", "mrleguan_huixue", "mrleguan_draw"],
		subSkill: {
			shoushang: {
				forced: true,
				trigger: {
					player: ["damageBefore", "loseHpBefore"],
				},
				filter: function (event, player) {
					return event.getParent().name != "mrleguan_kouxue";
				},
				content: function () {
					player.storage.mrleguan -= trigger.num;
					game.addVideo("storage", player, ["mrleguan", player.storage.mrleguan]);
					if (trigger.num) player.draw();
					trigger.cancel();
				},
				sub: true,
				sourceSkill: "mrleguan",
				_priority: 0,
			},
			huixue: {
				forced: true,
				trigger: {
					player: "recoverBefore",
				},
				filter: function (event, player) {
					return event.getParent().name != "mrleguan_kouxue";
				},
				content: function () {
					if (player.hp <= 0) {
						player.storage.mrleguan += 1;
						player.draw();
						event.finish();
					} else {
						player.storage.mrleguan += trigger.num;
						if (trigger.num) player.draw();
						trigger.cancel();
					}
				},
				sub: true,
				sourceSkill: "mrleguan",
				_priority: 0,
			},
			kouxue: {
				forced: true,
				trigger: {
					global: "phaseBegin",
				},
				content: function () {
					if (player.hp == player.storage.mrleguan) event.finish();
					if (player.hp > player.storage.mrleguan) player.loseHp(player.hp - player.storage.mrleguan);
					else player.recover(player.storage.mrleguan - player.hp);
				},
				sub: true,
				sourceSkill: "mrleguan",
				_priority: 0,
			},
			draw: {
				forced: true,
				trigger: {
					player: "dyingBegin",
				},
				content: function () {
					player.draw();
				},
				sub: true,
				sourceSkill: "mrleguan",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrxianshu: {
		enable: "phaseUse",
		usable: 1,
		content: function () {
			var numm = player.hp;
			player.loseHp(numm);
			player.draw(numm * 2 + 2);
			player.addTempSkill("mrxianshu2");
		},
		_priority: 0,
	},
	mrxianshu2: {
		trigger: {
			player: "phaseJieshuBegin",
		},
		alter: true,
		forced: true,
		content: function () {
			var numm = player.getStat("damage");
			if (numm) player.storage.mrleguan += numm;
			game.addVideo("storage", player, ["mrleguan", player.storage.mrleguan]);
		},
		_priority: 0,
	},
	mrdaoyan: {
		audio: "ext:阴阳师/audio:1",
		forced: true,
		mark: true,
		init: function (player) {
			player.storage.mrdaoyan = 7;
		},
		marktext: "纱",
		intro: {
			content: function (storage) {
				return "当前咒纱层数：" + storage + "层";
			},
		},
		trigger: {
			player: ["loseHpEnd", "damageEnd"],
		},
		filter: function (event, player) {
			return player.storage.mrdaoyan > 0;
		},
		content: function () {
			player.storage.mrdaoyan -= 1;
			player.changeHujia(1, "gain", 5);
		},
		group: ["mrdaoyan_damage", "mrdaoyan_draw"],
		subSkill: {
			damage: {
				trigger: {
					source: "damageBefore",
				},
				forced: true,
				content: function () {
					if (player.hujia > 0) trigger.num++;
				},
				sub: true,
				sourceSkill: "mrdaoyan",
				_priority: 0,
			},
			draw: {
				enable: "phaseUse",
				usable: 1,
				filter: function (event, player) {
					return player.storage.mrdaoyan > 0;
				},
				check: function () {
					return true;
				},
				content: function () {
					player.draw(2);
					player.storage.mrdaoyan -= 1;
					player.changeHujia();
				},
				ai: {
					order: 9,
					result: {
						player: 2,
					},
				},
				sub: true,
				sourceSkill: "mrdaoyan",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrhuozhou: {
		skillAnimation: true,
		animationColor: "thunder",
		unique: true,
		juexingji: true,
		trigger: {
			global: "phaseJieshuBegin",
		},
		forced: true,
		derivation: "mrzhoushi",
		filter: function (event, player) {
			return player.storage.mrdaoyan == 0;
		},
		content: function () {
			"step 0";
			player.awakenSkill("mrhuozhou");
			player.addSkill("mrzhoushi");
			player.gainMaxHp();
			player.recover();
			player.draw(2);
			("step 1");
			event.num = 0;
			event.players = game.filterPlayer();
			("step 2");
			if (event.num < event.players.length) {
				var target = event.players[event.num];
				if (target != player) target.loseHp();
				event.num++;
				event.redo();
			}
			("step 3");
			player.changeSkin({ characterName: "mr_huojinshen" }, "mr_huojinshen_juexing");
		},
		_priority: 0,
	},
	mrzhoushi: {
		group: ["mrzhoushi_kouxue", "mrzhoushi_hujia"],
		subSkill: {
			kouxue: {
				forced: true,
				trigger: {
					player: "damageEnd",
				},
				filter(event, player) {
					return event.source && event.num > 0 && event.source != player;
				},
				content: function () {
					var target = trigger.source;
					target.loseHp();
				},
				sub: true,
				sourceSkill: "mrzhoushi",
				_priority: 0,
			},
			hujia: {
				forced: true,
				trigger: {
					global: "dyingBegin",
				},
				content: function () {
					player.changeHujia();
				},
				sub: true,
				sourceSkill: "mrzhoushi",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrwanfa: {
		enable: "phaseUse",
		usable: 1,
		content: function () {
			var hpnum = player.hp;
			var maxhpnum = player.maxHp;
			player.loseHp(Math.floor(hpnum / 2));
			player.draw(Math.floor(hpnum / 2));
			player.changeHujia(Math.floor(maxhpnum / 2));
			player.addTempSkill("mrwanfa2", { player: "phaseZhunbeiBefore" });
		},
		_priority: 0,
	},
	mrwanfa2: {
		forced: true,
		alter: true,
		trigger: {
			player: "phaseBeginStart",
		},
		content: function () {
			var hpnum = player.hp;
			var maxhpnum = player.maxHp;
			var hujianum = player.hujia;
			var losehpnum = maxhpnum - hpnum;
			if (losehpnum > hpnum) player.recover(losehpnum - hpnum);
			else if (losehpnum < hpnum) player.loseHp(hpnum - losehpnum);
			if (hujianum + losehpnum < maxhpnum) player.recover(hujianum);
			else player.recover(maxhpnum - losehpnum);
			player.changeHujia(-hujianum);
		},
		_priority: 0,
	},
	mrxuanxue: {
		forced: true,
		derivation: "mrxinghui",
		trigger: {
			source: "damageBefore",
		},
		filter: function (event, player) {
			return event.player.countMark("mrxinghui") < event.player.hp;
		},
		content: function () {
			var num = trigger.num + 2;
			var numm = trigger.player.countMark("mrxinghui");
			trigger.num = 0;
			trigger.player.addMark("mrxinghui", num + numm < trigger.player.hp ? num : trigger.player.hp - numm);
		},
		group: ["mrxuanxue_skill", "mrxuanxue_damage"],
		subSkill: {
			skill: {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				forced: true,
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0;
				},
				content: function () {
					var players = game.filterPlayer();
					var l = players.length;
					for (var i = 0; i < l; i++) {
						players[i].addSkill("mrxinghui");
					}
				},
				sub: true,
				sourceSkill: "mrxuanxue",
				_priority: 0,
			},
			damage: {
				forced: true,
				trigger: {
					player: "damageBefore",
				},
				filter: function (event, player) {
					return player.hp > player.storage.mrxinghui;
				},
				content: function () {
					if (trigger.num + player.storage.mrxinghui <= player.hp) {
						player.storage.mrxinghui += trigger.num;
						trigger.num = 0;
					} else {
						player.storage.mrxinghui = player.hp;
						trigger.num = 0;
					}
					game.addVideo("storage", player, ["mrxinghui", player.storage.mrxinghui]);
				},
				sub: true,
				sourceSkill: "mrxuanxue",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrxinghui: {
		forced: true,
		trigger: {
			player: "damageBegin",
		},
		mark: true,
		init: function (player) {
			player.storage.mrxinghui = 0;
		},
		marktext: "血",
		intro: {
			content: function (storage) {
				return "当前“玄血”为" + storage;
			},
		},
		filter: function (event, player) {
			return player.storage.mrxinghui > 0;
		},
		content: function () {
			var num = trigger.num;
			if (player.storage.mrxinghui > num) {
				trigger.num += 1;
				player.storage.mrxinghui -= num + 1;
			} else if (player.storage.mrxinghui == num) {
				player.storage.mrxinghui -= num;
			} else if (player.storage.mrxinghui < num) {
				player.storage.mrxinghui = 0;
			}
			game.addVideo("storage", player, ["mrxinghui", player.storage.mrxinghui]);
		},
		mod: {
			cardEnabled(card, player) {
				if (card.name == "tao") return true;
			},
			playerEnabled(card, player, target) {
				if (card.name == "tao" && target == player && player.storage.mrxinghui) return "forceEnabled";
			},
		},
		group: ["mrxinghui_recover", "mrxinghui_jieyi", "mrxinghui_lose"],
		subSkill: {
			recover: {
				forced: true,
				trigger: {
					player: "recoverBefore",
				},
				filter: function (event, player) {
					return player.storage.mrxinghui > 0;
				},
				content: function () {
					if (trigger.num <= player.storage.mrxinghui) {
						player.storage.mrxinghui -= trigger.num;
						trigger.num = 0;
					} else if (trigger.num > player.storage.mrxinghui) {
						trigger.num -= player.storage.mrxinghui;
						player.storage.mrxinghui = 0;
					}
					game.addVideo("storage", player, ["mrxinghui", player.storage.mrxinghui]);
				},
				sub: true,
				sourceSkill: "mrxinghui",
				_priority: 0,
			},
			jieyi: {
				forced: true,
				trigger: {
					target: "useCardToTargeted",
				},
				filter: function (event, player) {
					return (event.card.name == "taoyuan" || event.card.name == "tao") && player.hp == player.maxHp && player.storage.mrxinghui;
				},
				content: function () {
					player.storage.mrxinghui -= 1;
					game.addVideo("storage", player, ["mrxinghui", player.storage.mrxinghui]);
				},
				sub: true,
				sourceSkill: "mrxinghui",
				_priority: 0,
			},
			lose: {
				forced: true,
				trigger: {
					player: "loseHpBegin",
				},
				filter: function (event, player) {
					return player.storage.mrxinghui > 0;
				},
				content: function () {
					if (trigger.num <= player.storage.mrxinghui) player.storage.mrxinghui -= trigger.num;
					else if (trigger.num > player.storage.mrxinghui) player.storage.mrxinghui = 0;
					game.addVideo("storage", player, ["mrxinghui", player.storage.mrxinghui]);
				},
				sub: true,
				sourceSkill: "mrxinghui",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrlongxi: {
		forced: true,
		trigger: {
			global: "phaseEnd",
		},
		filter: function (event, player) {
			return player.storage.mrxinghui == player.hp;
		},
		content: function () {
			player.draw(2);
			player.storage.mrxinghui = 0;
			game.addVideo("storage", player, ["mrxinghui", player.storage.mrxinghui]);
			player.storage.mrlongxi_CD = 0;
			player.addSkill("mrlongxi_CD");
			player.addSkillBlocker("mrlongxi");
			player.insertPhase();
		},
		subSkill: {
			CD: {
				forced: true,
				trigger: {
					player: "phaseJieshuBegin",
				},
				mark: true,
				marktext: "息",
				intro: {
					content: function () {
						return "【龙息】冷却中";
					},
				},
				content: function () {
					player.storage.mrlongxi_CD++;
					if (player.storage.mrlongxi_CD == 2) {
						player.removeSkillBlocker("mrlongxi");
						player.removeSkill("mrlongxi_CD");
					}
				},
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == "sha") return num + 1;
					},
				},
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrjiazhou: {
		forced: true,
		trigger: {
			global: "roundStart",
		},
		content: function () {
			player.changeHujia();
		},
		group: "mrjiazhou_sha",
		subSkill: {
			sha: {
				unequip: true,
				forced: true,
				trigger: {
					player: "damageEnd",
				},
				filter: function (event, player) {
					return event.source != player;
				},
				content: function () {
					var card = { name: "sha", isCard: true };
					player.useCard(card, trigger.source, false).card.mrbuwu1 = true;
				},
				ai: {
					unequip: true,
					skillTagFilter: function (player, tag, arg) {
						if (!arg || !arg.card || arg.card.mrbuwu1 != true) return false;
					},
				},
				sub: true,
				sourceSkill: "mrjiazhou",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrbuwu: {
		audio: "ext:阴阳师/audio:1",
		forced: true,
		usable: 1,
		trigger: {
			global: ["damageEnd", "loseHpEnd"],
		},
		filter: function (event, player) {
			if (!event.player.isIn()) return false;
			if (event.player == player) return false;
			if (event.player.hp == 1 || event.num >= 2) return true;
		},
		content: function () {
			var card = { name: "sha", isCard: true };
			player.useCard(card, trigger.player, false).card.mrbuwu2 = true;
		},
		ai: {
			unequip: true,
			skillTagFilter: function (player, tag, arg) {
				if (!arg || !arg.card || arg.card.mrbuwu2 != true) return false;
			},
		},
		group: "mrbuwu_sha",
		subSkill: {
			sha: {
				audio: "ext:阴阳师/audio/mrbuwu1.mp3",
				enable: "phaseUse",
				usable: 1,
				filterTarget: function (card, player, target) {
					var cardd = { name: "sha", isCard: true };
					return player.canUse(cardd, target, true, false);
				},
				filterCard: () => false,
				selectCard: -1,
				content: function () {
					var card = { name: "sha", isCard: true };
					player.useCard(card, target, false).card.mrbuwu3 = true;
				},
				ai: {
					order: 8,
					result: {
						target: -2,
					},
					unequip: true,
					skillTagFilter: function (player, tag, arg) {
						if (!arg || !arg.card || arg.card.mrbuwu3 != true) return false;
					},
				},
				sub: true,
				sourceSkill: "mrbuwu",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrzhanyi: {
		trigger: {
			global: "phaseAfter",
		},
		forced: true,
		filter: function (event, player) {
			return player.getStat("kill") > 0;
		},
		content: function () {
			player.insertPhase();
		},
		_priority: 0,
	},
	mrguizhan: {
		trigger: {
			source: "damageSource",
		},
		usable: 1,
		forced: true,
		filter: function (event, player) {
			if (event.getParent().name == "mrguizhan") return false;
			return true;
		},
		content: function () {
			"step 0";
			trigger.player.damage(player);
			("step 1");
			if (trigger.player.hp <= 1) {
				targets = game.filterPlayer();
				targets.remove(player);
				targets.sort(lib.sort.seat);
				var ll = targets.length;
				for (var i = 0; i < ll; i++) {
					targets[i].damage(player);
				}
			}
		},
		_priority: 0,
	},
	mryingshan: {
		unique: true,
		limited: true,
		mark: true,
		intro: {
			content: "limited",
		},
		skillAnimation: true,
		init: function (player) {
			//初始化
			player.storage.mryingshan = false; //技能未发动(xx为技能名)
		},
		filter: function (event, player) {
			//发动限制条件
			return player.storage.mryingshan == false; //你没发动过这个技能
		},
		enable: "phaseUse",
		filterTarget: function (card, player, target) {
			return true;
		},
		filterCard: () => false,
		selectCard: -1,
		content: function () {
			"step 0";
			player.storage.mryingshan = true; //技能发动过
			player.awakenSkill("mryingshan");
			targets[0].damage(player);
			("step 1");
			targets[0].damage(player);
			("step 2");
			targets[0].damage(player);
		},
		_priority: 0,
	},
	mrzhengfan: {
		trigger: {
			player: "damageEnd",
		},
		content: function () {
			"step 0";
			player.judge();
			("step 1");
			switch (result.color) {
				case "red":
					player.draw(2);
					break;

				case "black":
					player.useCard({ name: "sha", isCard: true }, false, trigger.source);
					break;

				default:
					break;
			}
		},
		_priority: 0,
	},
	mrhuisu: {
		trigger: {
			player: "changeHp",
		},
		forced: true,
		mark: true,
		init: function (player) {
			player.storage.mrhuisu = 3;
		},
		marktext: "溯",
		intro: {
			content: function (storage) {
				return "当前回溯层数：" + storage + "层";
			},
		},
		filter: function (event, player) {
			if (event.num > 0) return false;
			return player.storage.mrhuisu > 0;
		},
		content: function () {
			if (trigger.num + player.storage.mrhuisu < 0) player.storage.mrhuisu = 0;
			else player.storage.mrhuisu += trigger.num;
			game.addVideo("storage", player, ["mrhuisu", player.storage.mrhuisu]);
		},
		group: ["mrhuisu_fangyu", "mrhuisu_judge"],
		subSkill: {
			fangyu: {
				forced: true,
				firstDo: true,
				mod: {
					targetEnabled(card, target, player) {
						if (player != target && player.storage.mrhuisu == 3 && (get.type(card) == "trick" || get.type(card) == "delay")) return false;
					},
				},
				sub: true,
				sourceSkill: "mrhuisu",
				_priority: 0,
			},
			judge: {
				forced: true,
				trigger: {
					player: "damageEnd",
				},
				content: function () {
					"step 0";
					player.judge();
					("step 1");
					switch (result.suit) {
						case "spade":
							player.recover();
							break;

						case "heart":
							if (player.storage.mrhuisu < 3) player.recover();
							else player.draw();
							break;

						case "club":
							if (player.storage.mrhuisu < 2) player.recover();
							else player.draw();
							break;

						case "diamond":
							if (player.storage.mrhuisu < 1) player.recover();
							else player.draw();
							break;

						default:
							break;
					}
				},
				sub: true,
				sourceSkill: "mrhuisu",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrshixi: {
		derivation: ["mrjinzhan"],
		trigger: {
			global: "phaseEnd",
		},
		forced: true,
		filter: function (event, player) {
			if (player.hasSkill("mrshixi_used")) return false;
			if (player.storage.mrhuisu == 0) return true;
			return false;
		},
		content: function () {
			"step 0";
			player.logSkill("mrshixi");
			player.addTempSkill("mrshixi_used", "roundStart");
			("step 1");
			var cha = player.maxHp - player.hp;
			player.recover(cha);
			("step 2");
			player.storage.mrhuisu = 3;
			game.addVideo("storage", player, ["mrhuisu", player.storage.mrhuisu]);
			("step 3");
			player.draw(2);
			//player.addTempSkill("mrjinzhan",{player:"phaseUseEnd"});
			player.phaseUse();
		},
		subSkill: {
			used: {
				mark: true,
				intro: {
					content: "本轮已发动",
				},
				sub: true,
				sourceSkill: "mrshixi",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrjinzhan: {
		forced: true,
		trigger: {
			player: "phaseUseBegin",
		},
		filter: function (event, player) {
			return _status.currentPhase != player;
		},
		content: function () {
			"step 0";
			game.countPlayer(function (current) {
				if (current != player) current.addTempSkill("mrjinzhan_fengyin");
			});
			("step 1");
			player.addTempSkill("mrjinzhan_respond", { player: "phaseUseEnd" });
			player.addTempSkill("mrjinzhan_hurt", { player: "phaseUseEnd" });
			player.addTempSkill("mrjinzhan_clear", { player: "phaseUseEnd" });
		},
		subSkill: {
			fengyin: {
				sub: true,
				sourceSkill: "mrjinzhan",
				init: function (player, skill) {
					player.addSkillBlocker(skill);
					player.addTip(skill, "所有技能失效");
				},
				onremove: function (player, skill) {
					player.removeSkillBlocker(skill);
					player.removeTip(skill);
				},
				charlotte: true,
				skillBlocker: function (skill, player) {
					return !lib.skill[skill].persevereSkill && skill != "mrjinzhan_fengyin";
				},
				mark: true,
				marktext: "寂",
				intro: {
					content: function (storage, player, skill) {
						var string = "<li>时寂之刻：落入凝滞的时间之中，所有技能失效且无法响应时曜泷夜叉姬使用的牌\n";
						var list = player.getSkills(null, false, false).filter(function (i) {
							return lib.skill.mrjinzhan_fengyin.skillBlocker(i, player);
						});
						if (list.length) return string + "<br><li>失效技能：" + get.translation(list);
						return string + "<br><li>无失效技能";
					},
				},
				_priority: 0,
			},
			clear: {
				trigger: {
					player: "phaseUseEnd",
				},
				forced: true,
				charlotte: true,
				popup: false,
				content: function () {
					player.removeSkill("mrjinzhan_clear");
				},
				onremove: function () {
					game.countPlayer2(function (current) {
						current.removeSkill("mrjinzhan_fengyin");
					});
				},
				sub: true,
				sourceSkill: "mrjinzhan",
				_priority: 0,
			},
			respond: {
				sub: true,
				sourceSkill: "mrjinzhan",
				forced: true,
				trigger: {
					player: "useCard",
				},
				filter: function (event, player) {
					return (
						event.card &&
						(get.type(event.card) == "trick" || (get.type(event.card) == "basic" && !["shan", "tao", "jiu", "du"].includes(event.card.name))) &&
						game.hasPlayer(function (current) {
							return current != player;
						})
					);
				},
				content: function () {
					trigger.directHit.addArray(
						game.filterPlayer(function (current) {
							return current != player;
						})
					);
				},
				_priority: 0,
			},
			hurt: {
				usable: 1,
				trigger: {
					source: "damageBegin",
				},
				filter: function (event, player) {
					return player.storage.mrhuisu > 0;
				},
				content: function () {
					player.storage.mrhuisu -= 1;
					game.addVideo("storage", player, ["mrhuisu", player.storage.mrhuisu]);
					trigger.num += 1;
				},
				prompt2(event, player) {
					return "出牌阶段限一次，当你即将造成伤害时，你可以减少一个“回溯”令伤害+1。";
				},
				sub: true,
				sourceSkill: "mrjinzhan",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrpiaoqi: {
		trigger: {
			player: ["equipEnd", "loseEnd"],
		},
		forced: true,
		popup: false,
		filter: function (event, player) {
			if (player.equiping) return false;
			var es = player.getCards("e").length;
			if (player.additionalSkills.mrpiaoqi) {
				return player.additionalSkills.mrpiaoqi.length != es;
			} else {
				return es > 0;
			}
		},
		content: function () {
			lib.skill.mrpiaoqi.init(player, "mrpiaoqi");
		},
		init: function (player, skill) {
			var es = player.getCards("e").length;
			player.removeAdditionalSkill(skill);
			switch (es) {
				case 1:
					player.addAdditionalSkill(skill, ["mrpiaoqi_one"]);
					break;
				case 2:
					player.addAdditionalSkill(skill, ["mrpiaoqi_one", "mrpiaoqi_two"]);
					break;
				case 3:
					player.addAdditionalSkill(skill, ["mrpiaoqi_one", "mrpiaoqi_two", "mrpiaoqi_three"]);
					break;
				case 4:
					player.addAdditionalSkill(skill, ["mrpiaoqi_one", "mrpiaoqi_two", "mrpiaoqi_three", "mrpiaoqi_four"]);
					break;
				case 5:
					player.addAdditionalSkill(skill, ["mrpiaoqi_one", "mrpiaoqi_two", "mrpiaoqi_three", "mrpiaoqi_four", "mrpiaoqi_five"]);
					break;
			}
		},
		ai: {
			threaten: 1.2,
		},
		mod: {
			globalFrom: function (from, to, distance) {
				var es = from.getCards("e").length;
				return distance - es - 1; //例子，进攻距离+1
			},
			canBeDiscarded(card) {
				if (get.position(card) == "e") return false;
			},
		},
		subSkill: {
			one: {
				forced: true,
				trigger: {
					player: "phaseDrawBegin2",
				},
				filter(event, player) {
					return !event.numFixed;
				},
				content: function () {
					trigger.num++;
				},
				sub: true,
				sourceSkill: "mrpiaoqi",
				_priority: 0,
			},
			two: {
				forced: true,
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == "sha") return num + 1;
					},
				},
				sub: true,
				sourceSkill: "mrpiaoqi",
				_priority: 0,
			},
			three: {
				forced: true,
				trigger: {
					global: "roundStart",
				},
				content: function () {
					player.changeHujia();
				},
				sub: true,
				sourceSkill: "mrpiaoqi",
				_priority: 0,
			},
			four: {
				forced: true,
				trigger: {
					player: "phaseDiscardBefore",
				},
				content: function () {
					trigger.cancel();
				},
				sub: true,
				sourceSkill: "mrpiaoqi",
				_priority: 0,
			},
			five: {
				trigger: {
					player: "phaseBegin",
				},
				forced: true,
				async content(event, trigger, player) {
					trigger.phaseList.splice(trigger.num, 0, `phaseUse|${event.name}`);
				},
				sub: true,
				sourceSkill: "mrpiaoqi",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrfenglang: {
		derivation: ["mrguyan", "mrjuxu", "mrbingshi", "mrguanjun"],
		dutySkill: true,
		locked: false,
		trigger: {
			global: "dying",
		},
		frequent: true,
		filter: function (event, player) {
			if (event.player == player) return false;
			return !player.storage.mrfenglang || !player.storage.mrfenglang.includes(event.player);
		},
		content: function () {
			"step 0";
			if (!player.storage.mrfenglang) player.storage.mrfenglang = [];
			player.storage.mrfenglang.add(trigger.player);
			player.storage.mrfenglang.sortBySeat();
			player.markSkill("mrfenglang");
			player.recover();
			("step 1");
			var equip = get.cardPile(function (card) {
				var str = get.subtype(card);
				return get.type(card) == "equip" && player.hasEmptySlot(Number(str.substring(5, 6)));
			});
			if (!equip) {
				player.draw(2);
			} else player.equip(equip);
		},
		intro: {
			content: "已因$发动过技能",
		},
		group: ["mrfenglang_achieve", "mrfenglang_fail"],
		subSkill: {
			achieve: {
				trigger: {
					global: "phaseAfter",
				},
				forced: true,
				skillAnimation: true,
				animationColor: "fire",
				filter: function (event, player) {
					var equip = get.cardPile(function (card) {
						var str = get.subtype(card);
						return get.type(card) == "equip" && player.hasEmptySlot(Number(str.substring(5, 6)));
					});
					return !equip;
				},
				content: function () {
					game.log(player, "成功完成使命");
					player.awakenSkill("mrfenglang");
					player.addSkill("mrguyan");
					player.addSkill("mrjuxu");
					player.gainMaxHp();
					player.recover();
					player.changeSkin({ characterName: "mr_huoqubing" }, "mr_huoqubing_win1");
				},
				sub: true,
				sourceSkill: "mrfenglang",
				_priority: 0,
			},
			fail: {
				trigger: {
					player: "dying",
				},
				forced: true,
				content: function () {
					game.log(player, "使命失败");
					player.awakenSkill("mrfenglang");
					player.recover(2 - player.hp);
					var num = player.countCards("e");
					if (num > 0) player.chooseToDiscard("e", true, num);
					player.addSkill("mrbingshi");
					player.changeSkin({ characterName: "mr_huoqubing" }, "mr_huoqubing_fail");
				},
				sub: true,
				sourceSkill: "mrfenglang",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrguyan: {
		mark: true,
		forced: true,
		marktext: "祭",
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
		mod: {
			maxHandcard: function (player, num) {
				return num + player.getExpansions("mrguyan").length;
			},
		},
		group: ["mrguyan_put", "mrguyan_damage"],
		subSkill: {
			put: {
				enable: "phaseUse",
				usable: 1,
				position: "he",
				filter(event, player) {
					return player.countCards("he", { type: "equip" }) > 0;
				},
				filterCard: function (card) {
					return get.type(card) == "equip";
				},
				content: function () {
					player.addToExpansion(event.cards, player, "draw").gaintag.add("mrguyan");
				},
				sub: true,
				sourceSkill: "mrguyan",
				_priority: 0,
			},
			damage: {
				trigger: {
					player: "phaseEnd",
				},
				filter: function (event, player) {
					var cards = player.getExpansions("mrguyan");
					return cards.length;
				},
				content: function () {
					"step 0";
					var cards = player.getExpansions("mrguyan");
					var num = cards.length;
					player.chooseTarget(get.prompt("mrguyan"), "对至多" + get.cnNumber(num) + "名角色造成一点雷电伤害", [1, num]).set("ai", function (target) {
						return 1 - get.attitude(player, target);
					});
					("step 1");
					if (result.bool) {
						var targets = result.targets;
						var l = targets.length;
						for (var i = 0; i < l; i++) targets[i].damage(player, "thunder");
					}
				},
				sub: true,
				sourceSkill: "mrguyan",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrjuxu: {
		skillAnimation: true,
		animationColor: "thunder",
		unique: true,
		juexingji: true,
		trigger: {
			global: "phaseAfter",
		},
		forced: true,
		derivation: "mrguanjun",
		filter: function (event, player) {
			return player.getStat("kill") > 0;
		},
		content: function () {
			"step 0";
			player.awakenSkill("mrjuxu");
			player.addSkill("mrguanjun");
			player.gainMaxHp();
			player.recover();
			player.changeSkin({ characterName: "mr_huoqubing" }, "mr_huoqubing_win2");
			("step 1");
			player.insertPhase();
		},
		_priority: 0,
	},
	mrbingshi: {
		forced: true,
		trigger: {
			player: "phaseJieshuBegin",
		},
		content: function () {
			player.loseHp();
			player.draw(2);
		},
		_priority: 0,
	},
	mrguanjun: {
		enable: "phaseUse",
		usable: 2,
		mark: true,
		locked: false,
		zhuanhuanji: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				let str = player.storage.mrguanjun ? "出牌阶段限一次，你可以视为对一名其他角色使用一张无视防具不计入次数无距离限制伤害+1的杀。" : "出牌阶段限一次，你可以将一张牌交给一名角色，然后你与各其回复一点体力。";
				return str;
			},
		},
		init: function (player, skill) {
			player.storage.mrguanjun = 1;
		},
		filterTarget: function (card, player, target) {
			if (player.storage.mrguanjun) {
				var cardd = { name: "sha", isCard: true };
				return player.canUse(cardd, target, false, false);
			} else return true;
		},
		filterCard: () => false,
		selectCard: -1,
		position: "he",
		content: function () {
			"step 0";
			if (player.storage.mrguanjun) {
				player.addSkill("mrguanjun_add");
				var card = { name: "sha", isCard: true };
				player.useCard(card, target, false).card.mrguanjun = true;
				event.goto(2);
			} else {
				player.chooseCard("he", "将一张牌交给" + get.translation(target), true);
			}
			("step 1");
			if (result.cards) {
				target.gain(result.cards, player, "give");
				target.recover();
				player.recover();
			}
			("step 2");
			player.changeZhuanhuanji("mrguanjun");
		},
		ai: {
			unequip: true,
			skillTagFilter: function (player, tag, arg) {
				if (!arg || !arg.card || arg.card.mrguanjun != true) return false;
			},
		},
		subSkill: {
			add: {
				trigger: {
					player: "useCard2",
				},
				forced: true,
				popup: false,
				filter(event, player) {
					var evt = event.getParent(2);
					return evt.skill == "mrguanjun";
				},
				content: function () {
					trigger.baseDamage++;
					player.removeSkill("mrguanjun_add");
				},
				sub: true,
				sourceSkill: "mrguanjun",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrrenxing: {
		forced: true,
		trigger: {
			target: "useCardToPlayered",
		},
		mark: true,
		marktext: "人",
		intro: {
			content: "当前处于人形态！",
		},
		filter: function (event, player) {
			if (!player.storage.mrrenxing) {
				return get.type(event.card) == "trick" || get.type(event.card) == "delay";
			} else {
				return event.target == player;
			}
		},
		content: function () {
			player.draw();
			player.storage.mrrenxing_awaken += 1;
		},
		derivation: ["mrluling", "mrrenxing_rewrite"],
		group: ["mrrenxing_damage", "mrrenxing_use"],
		subSkill: {
			damage: {
				forced: true,
				trigger: {
					source: "damageEnd",
					player: "damageEnd",
				},
				filter: function (event, player) {
					if (!player.storage.mrrenxing) return event.player == player;
					else return true;
				},
				content: function () {
					"step 0";
					player.draw(2);
					("step 1"); //切换
					game.log(player, "切换到了鹿灵形态！");
					player.addSkill("mrluling");
					player.removeSkill("mrrenxing");
					player.changeSkin({ characterName: "mr_yao" }, "mr_yao_lu");
				},
				sub: true,
				sourceSkill: "mrrenxing",
				_priority: 0,
			},
			use: {
				usable: 1,
				enable: "phaseUse",
				filter: function (event, player) {
					return !player.storage.mrrenxing;
				},
				content: function () {
					"step 0";
					var equip = get.cardPile(function (card) {
						var str = get.subtype(card);
						return get.type(card) == "equip" && player.hasEmptySlot(Number(str.substring(5, 6)));
					});
					if (!equip) player.draw(2);
					else player.equip(equip);
					("step 1"); //切换
					game.log(player, "切换到了鹿灵形态！");
					player.addSkill("mrluling");
					player.removeSkill("mrrenxing");
					player.changeSkin({ characterName: "mr_yao" }, "mr_yao_lu");
				},
				ai: {
					order: 1,
					result: {
						player: 4,
					},
				},
				sub: true,
				sourceSkill: "mrrenxing",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrluling: {
		forced: true,
		mark: true,
		marktext: "鹿",
		intro: {
			content: "当前处于鹿灵形态！",
		},
		trigger: {
			source: "damageBegin",
		},
		content: function () {
			if (!player.storage.mrrenxing) trigger.cancel();
			else trigger.num--;
		},
		mod: {
			targetEnabled(card, target, player) {
				if (player != target && (get.type(card) == "trick" || get.type(card) == "delay" || get.type(card) == "basic")) return false;
			},
		},
		derivation: ["mrrenxing", "mrluling_rewrite"],
		group: "mrluling_change",
		subSkill: {
			change: {
				forced: true,
				trigger: {
					player: ["phaseAfter", "phaseBegin"],
				},
				content: function () {
					"step 0";
					player.recover();
					player.draw(2);
					player.storage.mrluling_awaken += 1;
					if (!player.storage.mrrenxing) event.goto(2);
					("step 1"); //重置
					player.restoreSkill("mrxishan");
					player.storage.mryingshan = false;
					("step 2"); //切换
					game.log(player, "切换到了人形态！");
					player.addSkill("mrrenxing");
					player.removeSkill("mrluling");
					player.changeSkin({ characterName: "mr_yao" }, "mr_yao_ren");
				},
				sub: true,
				sourceSkill: "mrluling",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrshangui: {
		skillAnimation: true,
		animationColor: "thunder",
		unique: true,
		juexingji: true,
		trigger: {
			global: "phaseAfter",
		},
		forced: true,
		derivation: "mrxishan",
		init: function (player) {
			player.storage.mrrenxing = 0;
			player.storage.mrrenxing_awaken = 0;
			player.storage.mrluling_awaken = 0;
		},
		filter: function (event, player) {
			return player.storage.mrrenxing_awaken >= 4 && player.storage.mrluling_awaken >= 2;
		},
		content: function () {
			"step 0";
			player.awakenSkill("mrshangui");
			player.gainMaxHp();
			player.chooseTarget([0, 3]).set("ai", function (target) {
				var att = get.attitude(_status.event.player, target);
				return 1 - att;
			});
			("step 1");
			var targets = result.targets;
			for (var i = 0; i < targets.length; i++) {
				targets[i].damage(player, "thunder");
			}
			("step 2");
			player.storage.mrrenxing = 1;
			player.addSkill("mrxishan");
		},
		_priority: 0,
	},
	mrxishan: {
		unique: true,
		limited: true,
		mark: true,
		intro: {
			content: "limited",
		},
		skillAnimation: true,
		init: function (player) {
			//初始化
			player.storage.mryingshan = false; //技能未发动(xx为技能名)
		},
		filter: function (event, player) {
			//发动限制条件
			return player.storage.mryingshan == false; //你没发动过这个技能
		},
		enable: "phaseUse",
		filterTarget: function (card, player, target) {
			return true;
		},
		filterCard: () => false,
		selectCard: -1,
		content: function () {
			player.storage.mryingshan = true; //技能发动过
			player.awakenSkill("mrxishan");
			targets[0].changeHujia();
			targets[0].draw();
		},
		ai: {
			order: 9,
			result: {
				player: 4,
				target: 4,
			},
		},
		_priority: 0,
	},
	mrxiezhan: {
		equipSkill: true,
		usable: 3,
		trigger: {
			player: "useCardToPlayered",
		},
		filter(event, player) {
			if (!event.isFirstTarget || (event.card.storage && event.card.storage.mrxiezhan)) return false;
			var type = get.type(event.card);
			if (type != "basic" && type != "trick") return false;
			var evt = event.getParent("phaseUse");
			if (!evt || evt.player != player) return false;
			return true;
		},
		prompt2(event, player) {
			var evt = event.getParent("phaseUse");
			var num = player.getHistory("useCard", function (evtx) {
				if (evtx.getParent("phaseUse") != evt) return false;
				return !evtx.card.storage || !evtx.card.storage.mrxiezhan;
			}).length;
			var str = "额外结算一次（出牌阶段限三次）";
			if (event.card.name == "sha" && game.hasNature(event.card)) str += get.translation(event.card.nature);
			return str + "【" + get.translation(event.card.name) + "】";
		},
		check(event, player) {
			return !get.tag(event.card, "norepeat");
		},
		content() {
			var evt = trigger.getParent("phaseUse");
			var num = player.getHistory("useCard", function (evtx) {
				if (evtx.getParent("phaseUse") != evt) return false;
				return true;
			}).length;
			trigger.getParent().effectCount += 1;
		},
		_priority: 0,
	},
	mrliangyuan: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		forced: true,
		content: function () {
			"step 0";
			let cards = player.getCards("h").filter(card => !card.hasGaintag("共享"));
			var l = cards.length;
			var up_cards = get.cards(7 - l);
			player.gain(up_cards);
			("step 1");
			let ccards = player.getCards("h").filter(card => !card.hasGaintag("共享"));
			player.addGaintag(ccards, "eternal_mrliangyuan_tag");
		},
		group: ["mrliangyuan_restore", "mrliangyuan_recover"],
		subSkill: {
			tag: {
				sub: true,
				sourceSkill: "mrliangyuan",
				_priority: 0,
			},
			restore: {
				trigger: {
					player: "phaseZhunbeiBegin",
				},
				filter(event, player) {
					return Array.from(ui.discardPile.childNodes).some(card => card.hasGaintag("eternal_mrliangyuan_tag"));
					/*const targets = game.players.slice().concat(game.dead);
								return targets.some(target => target.getStorage("dcqiqin").filterInD("d").length);*/
				},
				forced: true,
				content() {
					//const targets = game.players.slice().concat(game.dead);
					const cards = Array.from(ui.discardPile.childNodes).filter(card => card.hasGaintag("eternal_mrliangyuan_tag"));
					//const cards = targets.reduce((list, target) => list.addArray(target.getStorage("dcqiqin").filterInD("d")), []);
					player.gain(cards, "gain2"); //.gaintag.add("dcqiqin_tag");
				},
				sub: true,
				sourceSkill: "mrliangyuan",
				_priority: 0,
			},
			gain: {
				trigger: {
					player: ["useCard", "respond"],
				},
				forced: true,
				filter(event, player) {
					return event.player.hasHistory("lose", function (evt) {
						if (evt.getParent() != event) return false;
						for (var i in evt.gaintag_map) {
							if (evt.gaintag_map[i].includes("eternal_mrliangyuan_tag")) return true;
						}
						return false;
					});
				},
				content: function () {
					player.draw();
				},
			},
			recover: {
				trigger: {
					player: "phaseAfter",
				},
				filter: function (event, player) {
					return player.countCards("h", card => card.hasGaintag("eternal_mrliangyuan_tag")) > 0;
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseCardTarget({
							filterCard: card => card.hasGaintag("eternal_mrliangyuan_tag"),
							prompt: '选择一张"缘"将其移除游戏，然后选择一名角色，令其回复一点体力并摸两张牌',
							position: "h",
							ai1(card) {
								return 7 - get.value(card);
							},
							ai2(target) {
								var hhp = target.maxHp - target.hp;
								if (hhp == 0) return false;
								var num = target.hasSkillTag("maixie") ? 2 : 0;
								return get.attitude(_status.event.player, target) + num;
							},
						})
						.forResult();
				},
				async content(event, trigger, player) {
					var card = event.cards[0];
					var target = event.targets[0];
					player.lose(card, ui.mrliangyuan);
					await game.cardsGotoSpecial(card);
					game.log(player, "将", card, "移出游戏");
					player.$throw(card);
					await target.recover();
					await target.draw(2);
				},
				ai: {
					threaten: 1.7,
					result: {
						target(player, target) {
							if (target.hp == 1) return 5;
							if (player == target && player.maxHp > player.hp) return 5;
							return 2;
						},
					},
					expose: 0.3,
				},
				prompt2(event, player) {
					return '你可以将一张"缘"移出游戏，然后令一名角色回复一点体力并摸两张牌';
				},
			},
		},
		mod: {
			ignoredHandcard(card, player) {
				if (card.hasGaintag("eternal_mrliangyuan_tag")) return true;
			},
			cardDiscardable(card, player, name) {
				if (name == "phaseDiscard" && card.hasGaintag("eternal_mrliangyuan_tag")) return false;
			},
			cardUsable(card) {
				if (!card.cards) return;
				for (var i of card.cards) {
					if (i.hasGaintag("eternal_mrliangyuan_tag")) return Infinity;
				}
			},
			targetInRange(card) {
				if (!card.cards) return;
				for (var i of card.cards) {
					if (i.hasGaintag("eternal_mrliangyuan_tag")) return true;
				}
			},
		},
		_priority: 0,
	},
	mrshenge: {
		skillAnimation: true,
		animationColor: "wood",
		limited: true,
		init: (player, skill) => (player.storage[skill] = false),
		derivation: "mrshengqi",
		mark: true,
		intro: {
			content: "limited",
		},
		trigger: {
			player: "dying",
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			if (!_status.characterlist) {
				lib.skill.pingjian.initList();
			}
			if (!game.countPlayer(current => current.name1 == "mrfangyuan_yuanjieshen" || current.name2 == "mrfangyuan_yuanjieshen")) {
				if (player.name2 && get.character(player.name2)[3].includes("mrshenge")) {
					await player.reinitCharacter(player.name2, "mrfangyuan_yuanjieshen");
				} else {
					await player.reinitCharacter(player.name1, "mrfangyuan_yuanjieshen");
				}
				if (player.hp < 3) await player.recover(3 - player.hp);
			} else {
				await player.addSkills("mrshengqi");
				if (player.hp < 1) await player.recover(1 - player.hp);
			}
		},
		ai: {
			order: 1,
			save: true,
			skillTagFilter(player, arg, target) {
				return player == target;
			},
			result: {
				player: 10,
			},
		},
	},
	mrshengqi: {
		forced: true,
		trigger: {
			player: "phaseAfter",
		},
		async content(event, trigger, player) {
			const result = await player
				.chooseTarget("请选择【纺愿】的目标", '令一名角色向后移动一个座次，此时若"缘"为0，你对其造成一点伤害', true)
				.set("ai", function (target) {
					var att = get.attitude(_status.event.player, target);
					return 1 - att;
				})
				.forResult();
			let targets = game.filterPlayer();
			let target = result.targets[0];
			targets.sortBySeat(target);
			game.broadcastAll(
				function (target1, target2) {
					game.swapSeat(target1, target2);
				},
				targets[0],
				targets[1]
			);
			if (player.countCards("h", card => card.hasGaintag("eternal_mrliangyuan_tag")) == 0) {
				target.damage(player);
			}
		},
	},
	mrfangyuan: {
		trigger: {
			player: "phaseBegin",
		},
		filter(event, player, name) {
			if (!game.hasPlayer(current => current != player)) return false;
			return true;
		},
		async cost(event, trigger, player) {
			if (player.hasSkill("mrfangyuan2")) {
				player.removeSkill("mrfangyuan2");
				player.storage.mrfangyuan2 = null;
			}
			event.result = await player
				.chooseTarget("请选择【纺愿】的目标", "选择一名其他角色。你的回合结束时，该角色执行一个额外的出牌阶段。该角色回合结束时你执行一个额外的出牌阶段。效果触发时你摸一张牌", lib.filter.notMe)
				.set("ai", function (target) {
					var att = get.attitude(_status.event.player, target);
					if (att > 0) return 1 + att;
					return Math.random();
				})
				.forResult();
		},
		async content(event, trigger, player) {
			var target = event.targets[0];
			await player.logSkill("mrfangyuan", target);
			player.storage.mrfangyuan2 = target;
			await player.addSkill("mrfangyuan2");
		},
		group: ["mrfangyuan_fresh"],
		subSkill: {
			fresh: {
				forced: true,
				trigger: {
					global: "dieAfter",
				},
				filter: function (event, player) {
					return event.player == player.storage.mrfangyuan2;
				},
				async content(event, trigger, player) {
					player.storage.mrfangyuan2 = null;
					player.removeSkill("mrfangyuan2");
				},
			},
		},
		_priority: 0,
	},
	mrfangyuan2: {
		charlotte: true,
		onremove: true,
		mark: "character",
		sourceSkill: "mrfangyuan",
		intro: {
			content: "你的回合结束时，$执行一个额外的出牌阶段。$回合结束时你执行一个额外的出牌阶段。效果触发时你摸一张牌",
		},
		group: "mrfangyuan2_phaseuse",
		subSkill: {
			phaseuse: {
				forced: true,
				trigger: {
					global: "phaseAfter",
				},
				filter: function (event, player) {
					if (!player.storage.mrfangyuan2) return false;
					if (event.player == player || event.player == player.storage.mrfangyuan2) return true;
					return false;
				},
				content: function () {
					player.draw();
					if (trigger.player == player) player.storage.mrfangyuan2.phaseUse();
					else {
						player.phaseUse();
						player.storage.mrfangyuan2 = null;
						player.removeSkill("mrfangyuan2");
					}
				},
			},
		},
	},
	mrzhiyuan: {
		trigger: {
			player: "phaseUseEnd",
		},
		filter: function (event, player) {
			return game.countPlayer() > 1;
		},
		onremove: function (player, skill) {
			let targets1 = game.filterPlayer(function (current) {
				return current.hasMark("mrzhiyuan_blue");
			});
			if (targets1.length) {
				for (var i = 0; i < targets1.length; i++) targets1[i].removeMark("mrzhiyuan_blue");
			}
			let targets2 = game.filterPlayer(function (current) {
				return current.hasMark("mrzhiyuan_red");
			});
			if (targets2.length) {
				for (var i = 0; i < targets2.length; i++) targets2[i].removeMark("mrzhiyuan_red");
			}
		},
		init: (player, skill) => (player.storage[skill] = []),
		async content(event, trigger, player) {
			await player.draw();
			const result = await player
				.chooseCardTarget({
					prompt: "弃置一张牌，然后选择两名角色，根据弃置牌的颜色令选择的角色获得不同的标记",
					position: "he",
					selectTarget: 2,
					forced: true,
				})
				.forResult();
			let card = result.cards[0];
			let target1 = result.targets[0];
			let target2 = result.targets[1];
			await player.discard(card);
			if (!player.storage.mrzhiyuan.includes(target1)) player.storage.mrzhiyuan.add(target1);
			if (!player.storage.mrzhiyuan.includes(target2)) player.storage.mrzhiyuan.add(target2);
			await player.storage.mrzhiyuan.sortBySeat();
			await player.markSkill("mrzhiyuan");
			if (get.color(card) == "red") {
				let targets = game.filterPlayer(function (current) {
					return current.hasMark("mrzhiyuan_red");
				});
				if (targets.length) {
					targets[0].removeMark("mrzhiyuan_red");
					targets[1].removeMark("mrzhiyuan_red");
					await player.addTempSkill("mrzhiyuan_redeffect", { player: "phaseUseEnd" });
				}
				await target1.addMark("mrzhiyuan_red");
				await target2.addMark("mrzhiyuan_red");
			} else {
				let targets = game.filterPlayer(function (current) {
					return current.hasMark("mrzhiyuan_blue");
				});
				if (targets.length) {
					targets[0].removeMark("mrzhiyuan_blue");
					targets[1].removeMark("mrzhiyuan_blue");
					await player.addTempSkill("mrzhiyuan_blueeffect", { player: "phaseUseEnd" });
				}
				await target1.addMark("mrzhiyuan_blue");
				await target2.addMark("mrzhiyuan_blue");
			}
		},
		intro: {
			content: "已为$牵过线",
		},
		group: ["mrzhiyuan_red", "mrzhiyuan_blue", "mrzhiyuan_die"],
		subSkill: {
			red: {
				trigger: {
					global: "damageEnd",
				},
				forced: true,
				filter: function (event, player) {
					if (event.player.isDead()) return false;
					return event.player.hasMark("mrzhiyuan_red");
				},
				async content(event, trigger, player) {
					let targets = game.filterPlayer(function (current) {
						return current != trigger.player && current.hasMark("mrzhiyuan_red");
					});
					await targets[0].draw(2);
					targets[0].removeMark("mrzhiyuan_red");
					trigger.player.removeMark("mrzhiyuan_red");
					await player.addTempSkill("mrzhiyuan_redeffect", { player: "phaseUseEnd" });
				},
				marktext: "红",
				sourceSkill: "mrzhiyuan",
				intro: {
					content: "你已被牵上红线",
					markcount: function () {
						return 0;
					},
				},
			},
			blue: {
				trigger: {
					global: "damageEnd",
				},
				forced: true,
				filter: function (event, player) {
					if (event.player.isDead()) return false;
					return event.player.hasMark("mrzhiyuan_blue");
				},
				async content(event, trigger, player) {
					let targets = game.filterPlayer(function (current) {
						return current != trigger.player && current.hasMark("mrzhiyuan_blue");
					});
					await targets[0].chooseToDiscard(2, true);
					targets[0].removeMark("mrzhiyuan_blue");
					trigger.player.removeMark("mrzhiyuan_blue");
					await player.addTempSkill("mrzhiyuan_blueeffect", { player: "phaseUseEnd" });
				},
				marktext: "蓝",
				sourceSkill: "mrzhiyuan",
				intro: {
					content: "你已被牵上蓝线",
					markcount: function () {
						return 0;
					},
				},
			},
			redeffect: {
				forced: true,
				trigger: {
					player: "phaseUseBegin",
				},
				async content(event, trigger, player) {
					await player.draw();
				},
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == "sha") return num + 1;
					},
				},
				mark: true,
				marktext: "红",
				sourceSkill: "mrzhiyuan",
				intro: {
					content: "出牌阶段开始时，你摸一张牌，且使用“杀”的次数加一",
					markcount: function () {
						return 0;
					},
				},
			},
			blueeffect: {
				forced: true,
				trigger: {
					player: "phaseUseBegin",
				},
				async content(event, trigger, player) {
					if (game.hasPlayer(current => current.countDiscardableCards(player, "hej"))) {
						const result = await player
							.chooseTarget(
								"弃置一名角色区域内的一张牌",
								(card, player, target) => {
									return target.countDiscardableCards(player, "hej");
								},
								true
							)
							.forResult();
						if (result.bool && result.targets.length) {
							const target = result.targets[0];
							player.line(target, "green");
							if (target.countDiscardableCards(player, "hej")) await player.discardPlayerCard(target, "hej", true);
						}
					}
					player.recover();
				},
				mark: true,
				marktext: "蓝",
				sourceSkill: "mrzhiyuan",
				intro: {
					content: "出牌阶段开始时，你弃置一名角色区域内的一张牌，且回复一点体力",
					markcount: function () {
						return 0;
					},
				},
			},
			die: {
				forced: true,
				trigger: {
					global: "dieAfter",
				},
				filter: function (event, player) {
					let target1 = game.filterPlayer(function (current) {
						return current.hasMark("mrzhiyuan_red");
					});
					let target2 = game.filterPlayer(function (current) {
						return current.hasMark("mrzhiyuan_blue");
					});
					return target1.length == 1 || target2.length == 1;
				},
				async content(event, trigger, player) {
					let target1 = game.filterPlayer(function (current) {
						return current.hasMark("mrzhiyuan_red");
					});
					if (target1.length == 1) {
						target1[0].draw(2);
						target1[0].removeMark("mrzhiyuan_red");
						await player.addTempSkill("mrzhiyuan_redeffect", { player: "phaseUseEnd" });
					}
					let target2 = game.filterPlayer(function (current) {
						return current.hasMark("mrzhiyuan_blue");
					});
					if (target2.length == 1) {
						target2[0].discard(2, true);
						target2[0].removeMark("mrzhiyuan_blue");
						await player.addTempSkill("mrzhiyuan_blueeffect", { player: "phaseUseEnd" });
					}
				},
			},
		},
	},
	mryuanqi: {
		skillAnimation: true,
		animationColor: "thunder",
		unique: true,
		juexingji: true,
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		derivation: "mryuanjin",
		filter: function (event, player) {
			let num = game.countPlayer(function (current) {
				return !player.storage.mrzhiyuan.includes(current);
			});
			return num == 0;
		},
		async content(event, trigger, player) {
			await player.awakenSkill("mryuanqi");
			const result = await player.chooseTarget("选择一个角色，获得其武将牌上的一个技能", true, lib.filter.notMe).forResult();
			let target = result.targets[0];
			var list = [];
			var listm = [];
			var listv = [];
			if (target.name1 != undefined) listm = lib.character[target.name1][3];
			else listm = lib.character[target.name][3];
			if (target.name2 != undefined) listv = lib.character[target.name2][3];
			listm = listm.concat(listv);
			var func = function (skill) {
				var info = get.info(skill);
				if (!info) return false;
				return true;
			};
			for (var i = 0; i < listm.length; i++) {
				if (func(listm[i])) list.add(listm[i]);
			}
			if (list.length == 1) await player.addSkills(list[0]);
			else {
				const result2 = await player
					.chooseControl(list)
					.set("prompt", "选择获得" + get.translation(target) + "的一个技能")
					.set("forceDie", true)
					.set("ai", function () {
						return list.randomGet();
					})
					.forResult();
				await player.addSkills(result2.control);
			}
			await player.addSkill("mryuanjin");
		},
	},
	mryuanjin: {
		forced: true,
		trigger: {
			global: "roundStart",
		},
		filter(event, player) {
			if (
				game.hasPlayer(function (current) {
					return current.countCards("hej", "mrfangyuanchui");
				})
			)
				return false;
			return true;
			//return event.name!='phase'||game.phaseNumber==0;
		},
		direct: true,
		group: "mryuanjin_destroy",
		content() {
			"step 0";
			player
				.chooseTarget(get.prompt("mryuanjin"), "将【纺缘锤】置入一名角色的装备区", (card, player, target) => {
					var card = { name: "mrfangyuanchui" };
					return target.canEquip(card);
				})
				.set("ai", target => {
					return target.getUseValue({ name: "mrfangyuanchui" }) * get.attitude(_status.event.player, target);
				});
			("step 1");
			if (result.bool) {
				var target = result.targets[0];
				event.target = target;
				player.logSkill("mryuanjin", target);
				if (!lib.inpile.includes("mrfangyuanchui")) {
					lib.inpile.push("mrfangyuanchui");
				}
				event.card = game.createCard2("mrfangyuanchui", "heart", 3);
			} else event.finish();
			("step 2");
			if (card) target.equip(card);
		},
		subSkill: {
			destroy: {
				trigger: {
					global: ["loseEnd", "equipEnd", "addJudgeEnd", "gainEnd", "loseAsyncEnd", "addToExpansionEnd"],
				},
				forced: true,
				filter(event, player) {
					return game.hasPlayer(current => {
						var evt = event.getl(current);
						if (evt && evt.es) return evt.es.some(i => i.name == "mrfangyuanchui");
						return false;
					});
				},
				content() {
					var cards = [];
					game.countPlayer(current => {
						var evt = trigger.getl(current);
						if (evt && evt.es) return cards.addArray(evt.es.filter(i => i.name == "mrfangyuanchui"));
					});
					game.cardsGotoSpecial(cards);
					game.log(cards, "被销毁了");
				},
				sub: true,
				sourceSkill: "mryuanjin",
				_priority: 0,
			},
		},
	},
	mr_fangyuanchui: {
		equipSkill: true,
		trigger: {
			player: "damageBegin",
		},
		async content(event, trigger, player) {
			const result = await player.judge().forResult();
			if (result.color == "red") trigger.num--;
			else {
				var list = [];
				var listm = [];
				var listv = [];
				if (!trigger.source) return;
				if (trigger.source.name1 != undefined) listm = lib.character[trigger.source.name1][3];
				else listm = lib.character[trigger.source.name][3];
				if (trigger.source.name2 != undefined) listv = lib.character[trigger.source.name2][3];
				listm = listm.concat(listv);
				var func = function (skill) {
					var info = get.info(skill);
					if (!info || info.charlotte || info.persevereSkill) return false;
					return true;
				};
				for (var i = 0; i < listm.length; i++) {
					if (func(listm[i])) list.add(listm[i]);
				}
				const result2 = await player
					.chooseControl(list)
					.set("prompt", "选择" + get.translation(trigger.source) + "武将牌上的一个技能并令其失效")
					.set("forceDie", true)
					.set("ai", function () {
						return list.randomGet();
					})
					.forResult();
				await trigger.source.disableSkill("mr_fangyuanchui_not", result2.control);
				await trigger.source.addTempSkill("mr_fangyuanchui_not", { player: "phaseBefore" });
				game.log(player, "选择了", trigger.source, "的技能", "#g【" + get.translation(result2.control) + "】");
			}
		},
		group: "mr_fangyuanchui_draw",
		subSkill: {
			draw: {
				forced: true,
				trigger: {
					player: "phaseUseBegin",
				},
				async content(event, trigger, player) {
					player.draw();
				},
			},
			not: {
				onremove(player, skill) {
					player.enableSkill(skill);
				},
				locked: true,
				mark: true,
				charlotte: true,
				intro: {
					content(storage, player, skill) {
						var list = [];
						for (var i in player.disabledSkills) {
							if (player.disabledSkills[i].includes(skill)) list.push(i);
						}
						if (list.length) {
							var str = "失效技能：";
							for (var i = 0; i < list.length; i++) {
								if (lib.translate[list[i] + "_info"]) str += get.translation(list[i]) + "、";
							}
							return str.slice(0, str.length - 1);
						}
					},
				},
			},
		},
	},
	mrtianlai: {
		forced: true,
		trigger: {
			global: "roundStart",
		},
		filter(event, player) {
			if (
				game.hasPlayer(function (current) {
					return current.countCards("hej", "mryingshengchong");
				})
			)
				return false;
			return true;
			//return event.name!='phase'||game.phaseNumber==0;
		},
		direct: true,
		group: "mrtianlai_destroy",
		content() {
			"step 0";
			player
				.chooseTarget(get.prompt("mrtianlai"), "将【应声虫】置入一名角色的装备区", (card, player, target) => {
					var card = { name: "mryingshengchong" };
					return target.canEquip(card);
				})
				.set("ai", target => {
					return target.getUseValue({ name: "mryingshengchong" }) * get.attitude(_status.event.player, target);
				});
			("step 1");
			if (result.bool) {
				var target = result.targets[0];
				event.target = target;
				player.logSkill("mrtianlai", target);
				if (!lib.inpile.includes("mryingshengchong")) {
					lib.inpile.push("mryingshengchong");
				}
				event.card = game.createCard2("mryingshengchong", "spade", 1);
			} else event.finish();
			("step 2");
			if (card) target.equip(card);
		},
		subSkill: {
			destroy: {
				trigger: {
					global: ["loseEnd", "equipEnd", "addJudgeEnd", "gainEnd", "loseAsyncEnd", "addToExpansionEnd"],
				},
				forced: true,
				filter(event, player) {
					return game.hasPlayer(current => {
						var evt = event.getl(current);
						if (evt && evt.es) return evt.es.some(i => i.name == "mryingshengchong");
						return false;
					});
				},
				content() {
					var cards = [];
					game.countPlayer(current => {
						var evt = trigger.getl(current);
						if (evt && evt.es) return cards.addArray(evt.es.filter(i => i.name == "mryingshengchong"));
					});
					game.cardsGotoSpecial(cards);
					game.log(cards, "被销毁了");
				},
				sub: true,
				sourceSkill: "mrtianlai",
				_priority: 0,
			},
		},
	},
	mrrenyu: {
		forced: true,
		trigger: {
			player: "phaseBegin",
		},
		derivation: ["mrzhulang", "mrxige"],
		async content(event, trigger, player) {
			const list = [];
			list.push("选项一");
			list.push("选项二");
			list.push("背水！");
			const control = await player
				.chooseControl(list)
				.set("choiceList", ["摸两张牌，获得【逐浪】至你的下个回合开始", "回复一点体力，获得【汐歌】至你的下个回合开始", "背水！减1点体力上限并执行所有选项"])
				.set("prompt", get.prompt("mrrenyu"))
				.set("ai", () => {
					let bool1 = player.maxHp - player.hp;
					let bool2 = player.countCards("h");
					if (player.hp <= 1 && player.maxHp >= 3 && bool2 <= 2) return "背水！";
					else if (bool1) return "选项二";
					else return "选项一";
				})
				.forResultControl();
			if (control == "背水！") {
				await player.loseMaxHp();
				await player.changeSkin({ characterName: "mr_duoliya" }, "mr_duoliya_both");
			} else if (control == "选项一") await player.changeSkin({ characterName: "mr_duoliya" }, "mr_duoliya_yu");
			else if (control == "选项二") await player.changeSkin({ characterName: "mr_duoliya" }, "mr_duoliya_ren");
			if (["选项一", "背水！"].includes(control)) {
				await player.draw(2);
				await player.addTempSkill("mrzhulang", { player: "phaseBefore" });
			}
			if (["选项二", "背水！"].includes(control)) {
				await player.recover();
				await player.addTempSkill("mrxige", { player: "phaseBefore" });
			}
		},
	},
	mrzhulang: {
		forced: true,
		mark: true,
		marktext: "鱼",
		intro: {
			content: "当前处于人鱼形态！拥有【逐浪】技能！",
		},
		trigger: {
			player: "useCard",
		},
		filter: function (event, player) {
			return player.getHistory("useCard").indexOf(event) == 0;
		},
		async content(event, trigger, player) {
			let type = get.type(trigger.card);
			if (type == "delay") type = "trick";
			player.storage.mrzhulang = type;
			await player.addTempSkill("mrzhulang_draw");
		},
		subSkill: {
			draw: {
				forced: true,
				mark: true,
				marktext: "逐",
				intro: {
					content(storage, player) {
						var str = "锦囊牌";
						var type = player.storage.mrzhulang;
						if (type == "basic") str = "基本牌";
						else if (type == "equip") str = "装备牌";
						return "当你使用" + str + "时摸一张牌";
					},
				},
				trigger: {
					player: "useCard",
				},
				filter: function (event, player) {
					let type = get.type(event.card);
					if (type == "delay") type = "trick";
					return type == player.storage.mrzhulang && player.getHistory("useCard").indexOf(event) > 0;
				},
				async content(event, trigger, player) {
					player.draw();
				},
			},
		},
	},
	mrxige: {
		forced: true,
		mark: true,
		marktext: "人",
		intro: {
			content: "当前处于人形态！拥有【汐歌】技能！",
		},
		trigger: {
			player: "damageEnd",
		},
		filter: function (event, player) {
			return event.source && event.source != player;
		},
		async content(event, trigger, player) {
			const { result } = await trigger.player.judge();
			switch (result.suit) {
				case "heart":
					await trigger.player.recover();
					break;
				case "diamond":
					await trigger.player.draw(2);
					break;
				case "club":
					await trigger.source.chooseToDiscard("he", 2, true);
					break;
				case "spade":
					await trigger.source.turnOver();
					break;
			}
		},
	},
	mryimo: {
		trigger: {
			player: "phaseUseBegin",
		},
		forced: true,
		filter: function (event, player) {
			return player.hasEnabledSlot();
		},
		async content(event, trigger, player) {
			let bool1 = 1;
			while (bool1) {
				bool1 = 0;
				const result1 = await player.chooseToDisable().forResult();
				const targets = await player
					.chooseTarget(1, true, function (card, player, target) {
						if (player == target) return false;
						return player.canCompare(target);
					})
					.set("ai", function (target) {
						let player = _status.event.player;
						return 1 - get.attitude(player, target);
					})
					.forResultTargets();
				let target = targets[0];
				if (target.countCards("h") == 0) await target.draw();
				const result2 = await player.chooseToCompare(target).forResult();
				if (result2.bool) {
					let bool2 = 0;
					for (var i = 0; i < 6; i++) {
						if (player.isDisabled(i) && target.hasEnabledSlot(i)) {
							await target.disableEquip(i);
							bool2 = 1;
						}
					}
					if (!bool2) await target.damage(2, player);
				} else {
					if (player.hasEnabledSlot()) {
						const result3 = await player.chooseBool("是否继续发动【一摸】？", `选择并废除一个装备栏和${get.translation(target)}拼点`).forResult();
						if (result3.bool) bool1 = 1;
					}
				}
			}
		},
	},
	mrhanse: {
		forced: true,
		trigger: {
			player: "disableEquipAfter",
		},
		async content(event, trigger, player) {
			await player.gainMaxHp();
			await player.recover();
			let num = await player.countDisabled();
			await player.draw(num);
		},
		group: ["mrhanse_enable"],
		subSkill: {
			enable: {
				forced: true,
				trigger: {
					player: "phaseAfter",
				},
				filter: function (event, player) {
					return !player.hasEnabledSlot();
				},
				async content(event, trigger, player) {
					await player.loseMaxHp(4);
					await player.enableEquip([1, 2, 3, 4, 5]);
				},
			},
		},
	},
	mryanyuan: {
		trigger: {
			player: "damageEnd",
		},
		mark: true,
		marktext: "演",
		intro: {
			content: function (storage, player, skill) {
				var string = "<li>发挥演员的本领，受到伤害后可以获得一个技能，至多获得四个技能\n";
				var list = player.storage.mryanyuan;
				if (list.length) return string + "<br><li>获得技能(从早到晚)：" + get.translation(list);
				return string + "<br><li>无获得技能";
			},
		},
		init: function (player) {
			player.storage.mryanyuan = [];
		},
		async content(event, trigger, player) {
			var current = game.expandSkills(player.getSkills());
			var lists = get.gainableSkills(function (info, skill, name) {
				if (current.includes(skill)) return false;
				return lib.character[name][1] == "yys" || lib.character[name][1] == "nong";
				//return lib.characterSort.阴阳师.阴阳师_yys && lib.characterSort.阴阳师.阴阳师_yys.includes(name);
			}, player);
			var list = [];
			if (!lists.length) {
				player.chat("看来没有那种技能呢……");
				return;
			}
			for (var skill of lists) {
				let info = lib.skill[skill];
				if (!info) continue;
				if (typeof info.derivation == "string") lists.add(info.derivation);
				else if (Array.isArray(info.derivation)) {
					for (var skill2 of info.derivation) lists.add(skill2);
				}
			}
			if (lists.length > 5) {
				for (var i = 0; i < 5; i++) {
					var skill = await lists.randomGet();
					list.add(skill);
					lists.remove(skill);
				}
			} else list = lists;
			var dialog = ui.create.dialog("forcebutton");
			for (const skill of list) {
				var text = game.getSkillOwner(skill).map(c => get.translation(c));
				if (!text.length) {
					text = ["无"];
				}
				dialog.addText(`技能拥有者:${text}`);
				dialog.add([[[skill, '<div class="popup pointerdiv" style="width:80%;display:inline-block"><div class="skill">【' + get.translation(skill) + "】</div><div>" + lib.translate[skill + "_info"] + "</div></div>"]], "textbutton"]);
				dialog.addText("<br>");
			}
			var next = player.chooseButton(dialog, 1, true);
			next.set("ai", function (button) {
				return Math.random();
			});
			var result2 = await next.forResult();
			var skill = result2.links[0];
			if (player.storage.mryanyuan.length == 4) {
				if (player.hasSkill(player.storage.mryanyuan[0])) await player.removeSkill(player.storage.mryanyuan[0]);
				let listss = [];
				for (var i = 1; i <= 3; i++) listss.add(player.storage.mryanyuan[i]);
				listss.add(skill);
				player.storage.mryanyuan = listss;
			} else await player.storage.mryanyuan.add(skill);
			await player.addSkill(skill);
			var text = await game.getSkillOwner(skill);
			if (!text.length) {
				text = ["不知道谁"];
			}
			game.log(player, "获得了", "#b" + get.translation(text[0]), "的技能", "#g【" + get.translation(result2.links) + "】");
			if (text[0] != "不知道谁") await player.flashAvatar("mryanyuan", text[0]);
		},
		group: ["mryanyuan_flash"],
		subSkill: {
			flash: {
				forced: true,
				trigger: {
					player: ["useSkill", "logSkill"],
				},
				filter: function (event, player) {
					let skill = get.sourceSkillFor(event);
					return player.storage.mryanyuan.includes(skill);
				},
				async content(event, trigger, player) {
					let skill = get.sourceSkillFor(trigger);
					var text = await game.getSkillOwner(skill);
					if (text) await player.flashAvatar("mryanyuan", text[0]);
				},
			},
		},
	},
	mryuanjie: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		forced: true,
		content: function () {
			let cards = player.getCards("h").filter(card => !card.hasGaintag("共享"));
			player.addGaintag(cards, "eternal_mrliangyuan_tag");
		},
		group: ["mryuanjie_draw", "mryuanjie_transfer"],
		subSkill: {
			draw: {
				trigger: {
					player: "loseAfter",
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				forced: true,
				filter: function (event, player) {
					var evt = event.getl(player);
					return evt && evt.cards && evt.cards.some(i => i.hasGaintag("eternal_mrliangyuan_tag"));
				},
				async content(event, trigger, player) {
					await player.draw();
				},
			},
			transfer: {
				forced: true,
				trigger: {
					player: "phaseUseBegin",
				},
				filter: function (event, player) {
					let cards = player.getCards("h", i => {
						return !i.hasGaintag("eternal_mrliangyuan_tag");
					});
					return cards.length;
				},
				async content(event, trigger, player) {
					let cards = await player.getCards("h", i => {
						return !i.hasGaintag("eternal_mrliangyuan_tag");
					});
					var card = await cards.randomGet();
					await player.addGaintag(card, "eternal_mrliangyuan_tag");
				},
			},
		},
	},
	mryuanshen: {
		mark: true,
		forced: true,
		zhuanhuanji: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				let str = player.storage.mryuanshen ? "下个回合开始时，你弃置所有除“缘”外的手牌，然后获得所有弃牌堆中的“缘”，最后获得技能【良缘】和【生气】至你的下个回合开始。" : "下个回合开始时，你弃置手牌中所有的“缘”并摸等量的牌，然后获得技能【纺愿】和【织缘】至你的下个回合开始。";
				return str;
			},
		},
		init: function (player, skill) {
			player.storage.mryuanshen = 1;
		},
		trigger: {
			player: "phaseBegin",
		},
		async content(event, trigger, player) {
			if (player.storage.mryuanshen) {
				let ccards = await player.getCards("h", i => {
					return !i.hasGaintag("eternal_mrliangyuan_tag");
				});
				if (ccards) await player.discard(ccards);
				const cards = Array.from(ui.discardPile.childNodes).filter(card => card.hasGaintag("eternal_mrliangyuan_tag"));
				if (cards) await player.gain(cards, "gain2");
				await player.addTempSkill("mrliangyuan", { player: "phaseBeginStart" });
				await player.addTempSkill("mrshengqi", { player: "phaseBeginStart" });
				await player.changeSkin({ characterName: "mrda_yuanxiaoyuan" }, "mrda_yuanxiaoyuan_xiaoyuan");
				await player.changeZhuanhuanji("mryuanshen");
			} else {
				let ccards = await player.getCards("h", i => {
					return i.hasGaintag("eternal_mrliangyuan_tag");
				});
				if (ccards) {
					await player.discard(ccards);
					await player.draw(ccards.length);
				}
				await player.addTempSkill("mrfangyuan", { player: "phaseBeginStart" });
				await player.addTempSkill("mrzhiyuan", { player: "phaseBeginStart" });
				await player.changeSkin({ characterName: "mrda_yuanxiaoyuan" }, "mrda_yuanxiaoyuan_dayuan");
				await player.changeZhuanhuanji("mryuanshen");
			}
		},
	},
	共享: {
		init(player, skill) {
			lib.translate["共享"] = "共享";
			lib.translate["共享_info"] = "锁定技，拥有此技能的角色共享手牌，且手牌互相可见。当你处于弃牌阶段时，你无法弃置“共享”牌。";
			_status.gongxiang = _status.gongxiang || {
				cards: [],
				players: [],
			};
			ui.gongxiang = ui.gongxiang || ui.create.div("#gongxiang");
			for (let card of player.getCards("h")) {
				if (_status.gongxiang.cards.some(g => g.name === card.name && g.suit === card.suit && g.number === card.number)) continue;
				_status.gongxiang.cards.push(card);
			}
			_status.gongxiang.players.push(get.translation(player.name));
			get.event().trigger("gongxiang_update");
		},
		mark: true,
		direct: true,
		charlotte: true,
		intro: {
			content() {
				return "当前共享手牌的角色：</br>" + _status.gongxiang.players;
			},
		},
		mod: {
			ignoredHandcard(card, player) {
				return card.hasGaintag("共享");
			},
			cardDiscardable(card, player, name) {
				if (name == "phaseDiscard") return !card.hasGaintag("共享");
				return true;
			},
		},
		ai: {
			viewHandcard: true,
			skillTagFilter(player, tag, arg) {
				if (arg == player) return false;
				if (arg.hasSkill("共享_update")) return true;
				return false;
			},
		},
		onremove: function (player, skill) {
			//处理自己手中的“共享”牌
			var cards = player.getCards("h", i => {
				return i.hasGaintag("共享");
			});
			player.lose(cards, ui.gongxiang);

			//处理其他人手中的“共享牌”
			const playerCards = player.getCards("h").filter(c => _status.gongxiang.cards.includes(c));
			game.players.forEach(p => {
				if (p == player) return;
				var ccards = p.getCards("h").filter(c => playerCards.some(cc => c.name === cc.name && c.suit === cc.suit && c.number === cc.number));
				p.lose(ccards, ui.gongxiang);
			});

			//移除标记
			_status.gongxiang.cards = _status.gongxiang.cards.filter(g => !playerCards.some(card => g.name === card.name && g.suit === card.suit && g.number === card.number));
			_status.gongxiang.players = _status.gongxiang.players.filter(p => p != get.translation(player.name));
		},
		group: ["共享_lose", "共享_gain", "共享_update", "共享_die"],
		subSkill: {
			lose: {
				charlotte: true,
				firstDo: true,
				direct: true,
				trigger: {
					player: ["useCardBefore", "respondBefore", "loseBegin", "addToExpansionBegin"],
				},
				filter(event, player) {
					if (!event.cards || !event.cards.length) return false;
					return event.cards.some(card => _status.gongxiang.cards.some(g => g.name === card.name && g.suit === card.suit && g.number === card.number));
				},
				content() {
					//获取事件中的"共享牌"
					const sharedCards = trigger.cards.filter(card => _status.gongxiang.cards.some(g => g.name === card.name && g.suit === card.suit && g.number === card.number));
					//收集事件中的非"共享牌"
					var ccards = [];
					ccards = trigger.cards.filter(card => !sharedCards.some(c => c.name === card.name && c.suit === card.suit && c.number === card.number));
					//找到真实牌，将共享牌移除游戏
					game.players.forEach(p => {
						const playerCards = p.getCards("h").filter(card => sharedCards.some(c => c.name === card.name && c.suit === card.suit && c.number === card.number));
						if (playerCards.some(c => _status.gongxiang.cards.includes(c))) {
							var cards = playerCards.filter(card => _status.gongxiang.cards.includes(card));
							ccards = ccards.concat(cards);
						}
						p.lose(playerCards, ui.gongxiang);
					});
					if (event.triggername == "useCardBegin") {
						trigger.cards = ccards;
					} else if (event.triggername == "addToExpansionBegin") {
						trigger.cards = ccards;
					} else if (trigger.type == "discard" || trigger.getParent(2).name == "recast") game.cardsDiscard(ccards);
					_status.gongxiang.cards = _status.gongxiang.cards.filter(g => !sharedCards.some(card => g.name === card.name && g.suit === card.suit && g.number === card.number));
				},
			},
			gain: {
				trigger: {
					player: ["gainAfter"],
				},
				charlotte: true,
				direct: true,
				firstDo: true,
				filter(event, player) {
					return player.getCards("h").some(card => !card.hasGaintag("共享"));
				},
				content: async (event, trigger, player) => {
					let cards = player.getCards("h").filter(card => !card.hasGaintag("共享"));
					for (let card of cards) {
						if (!_status.gongxiang.cards.some(g => card.name == g.name && card.suit == g.suit && card.number == g.number)) {
							_status.gongxiang.cards.push(card);
						}
					}
					event.trigger("gongxiang_update");
				},
			},
			update: {
				trigger: {
					global: ["gongxiang_update"],
				},
				charlotte: true,
				direct: true,
				firstDo: true,
				filter(event, player) {
					var cards = player.getCards("h");
					let less = _status.gongxiang.cards.some(g => !cards.some(card => card.name === g.name && card.suit === g.suit && card.number === g.number));
					return less;
				},
				content: async (event, trigger, player) => {
					var cards = player.getCards("h");
					let less = _status.gongxiang.cards.filter(g => !cards.some(card => card.name === g.name && card.suit === g.suit && card.number === g.number));
					cards = [];
					for (let card of less) {
						cards.push(game.createCard(card));
					}
					if (less) {
						player.gain(cards, "bySelf").gaintag.add("共享");
					}
				},
			},
			die: {
				trigger: {
					global: "die",
				},
				charlotte: true,
				firstDo: true,
				direct: true,
				filter: function (event, player) {
					return event.player.hasSkill("共享");
				},
				content() {
					trigger.player.removeSkill("共享");
				},
			},
		},
	},
	mrnawu: {
		persevereSkill: true,
		trigger: {
			player: "phaseBegin",
		},
		derivation: "共享",
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(1, false, "你可以选择一名角色，然后你与其获得技能【共享】至你的下个回合开始", function (card, player, target) {
					return player != target;
				})
				.set("ai", function (target) {
					let player = _status.event.player;
					return 1 - get.attitude(player, target) * player.countCards("h");
				})
				.forResult();
		},
		async content(event, trigger, player) {
			await player.addSkill("共享");
			await event.targets[0].addSkill("共享");
			player.storage.mrnawu = event.targets[0];
		},
		group: "mrnawu_delete",
		subSkill: {
			delete: {
				forced: true,
				trigger: {
					player: "phaseBefore",
				},
				filter: function (event, player) {
					return player.storage.mrnawu;
				},
				async content(event, trigger, player) {
					await player.removeSkill("共享");
					await player.storage.mrnawu.removeSkill("共享");
					player.storage.mrnawu = null;
				},
			},
		},
	},
	mrshushu: {
		persevereSkill: true,
		trigger: {
			player: ["mrshushu_beginAfter", "mrshushu_addAfter", "mrtaiguAfter"],
		},
		filter(event, player) {
			let skills = [];
			let current = player.additionalSkills?.mrshushu?.length ?? 0;
			let target = player.countMark("mrshushu") == lib.skill.mrshushu.maxMarkCount ? lib.skill.mrshushu.derivation.length : Math.floor(player.countMark("mrshushu") / 25);
			return target > current;
		},
		forced: true,
		popup: false,
		locked: false,
		beginMarkCount: 20,
		maxMarkCount: 99,
		derivation: ["mryuhun", "mrnawu", "mrshishen", "mrlanpiao"],
		addMark(player, num) {
			num = Math.min(num, lib.skill.mrshushu.maxMarkCount - player.countMark("mrshushu"));
			player.addMark("mrshushu", num);
		},
		group: ["mrshushu_begin", "mrshushu_add"],
		async content(event, trigger, player) {
			const derivation = lib.skill.mrshushu.derivation,
				skills = player.countMark("mrshushu") == lib.skill.mrshushu.maxMarkCount ? derivation : derivation.slice(0, Math.floor(player.countMark("mrshushu") / 25));
			player.addAdditionalSkill("mrshushu", skills);
		},
		markimage: "extension/阴阳师/card/gouyu.png",
		intro: {
			name: "勾玉(鼠鼠)",
			name2: "勾玉",
			content: function (storage, player) {
				let derivation = lib.skill.mrshushu.derivation,
					num = player.countMark("mrshushu"),
					string = "<li>当前勾玉数为" + num;
				let skills = num == lib.skill.mrshushu.maxMarkCount ? derivation : derivation.slice(0, Math.floor(num / 25));
				if (num >= 25) return string + "<br><li>已解锁技能：" + get.translation(skills);
				else return string + "<br><li>暂未解锁技能";
			},
		},
		subSkill: {
			begin: {
				persevereSkill: true,
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				filter(event, player) {
					return event.name != "phase" || game.phaseNumber == 0;
				},
				forced: true,
				locked: false,
				async content(event, trigger, player) {
					const num = game.hasPlayer(current => {
						return current !== player && current.group === "yys" && player.hasZhuSkill("mrtaigu", current);
					})
						? 60
						: lib.skill.mrshushu.beginMarkCount;
					lib.skill.mrshushu.addMark(player, num);
				},
				sub: true,
				sourceSkill: "mrshushu",
				_priority: 0,
			},
			add: {
				persevereSkill: true,
				trigger: {
					player: ["gainAfter", "damageEnd"],
					source: "damageSource",
					global: "loseAsyncAfter",
				},
				filter(event, player) {
					if (player.countMark("mrshushu") >= lib.skill.mrshushu.maxMarkCount) return false;
					if (event.name === "damage") return event.num > 0;
					return event.getg(player).length > 0;
				},
				getIndex(event, player, triggername) {
					if (event.name === "damage") return event.num;
					return 1;
				},
				forced: true,
				locked: false,
				async content(event, trigger, player) {
					let toAdd = 5 * (1 + (trigger.name === "damage") + (event.triggername === "damageSource"));
					lib.skill.mrshushu.addMark(player, toAdd);
				},
				sub: true,
				sourceSkill: "mrshushu",
				_priority: 0,
			},
		},
		_priority: 0,
	},
	mrtaigu: {
		persevereSkill: true,
		zhuSkill: true,
		trigger: {
			player: "mrshushu_beginBegin",
		},
		forced: true,
		locked: false,
		content() {},
		_priority: 0,
	},
	mrshishen: {
		persevereSkill: true,
		trigger: {
			player: "dyingBegin",
		},
		limited: true,
		skillAnimation: true,
		animationColor: "orange",
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => (player.storage[skill] = false),
		async content(event, trigger, player) {
			var list;
			if (_status.characterlist) {
				list = [];
				for (var i = 0; i < _status.characterlist.length; i++) {
					var name = _status.characterlist[i];
					if (lib.character[name][1] == "yys") list.push(name);
				}
			} else {
				list = get.gainableCharacters(function (info) {
					return info[1] == "yys";
				});
			}
			var players = game.players.concat(game.dead);
			for (var i = 0; i < players.length; i++) {
				list.remove(players[i].name);
				list.remove(players[i].name1);
				list.remove(players[i].name2);
			}
			var next = player
				.chooseButton(true)
				.set("ai", function (button) {
					return get.rank(button.link, true) - lib.character[button.link][2];
				})
				.set("createDialog", ["将武将牌替换为一名角色", [list.randomGets(5), "character"]]);
			await player.awakenSkill("mrshishen");
			const result = await next.forResult();
			var cards = await player.getCards("hej");
			await player.discard(cards);

			var info = lib.character[result.links[0]];
			await player.reinitCharacter(get.character(player.name2, 3).includes("mrshishen") ? player.name2 : player.name1, result.links[0]);

			var num = info.maxHp - player.maxHp;
			if (num > 0) await player.gainMaxHp(num);
			else await player.loseMaxHp(-num);
			await player.recover(info.maxHp - player.hp);
			player.draw();
		},
		ai: {
			order: 1,
			save: true,
			skillTagFilter(player, arg, target) {
				return player == target;
			},
			result: {
				player: 10,
			},
		},
	},
	mryuhun: {
		persevereSkill: true,
		enable: "phaseUse",
		usable: 1,
		check(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			var cards = [];
			var card1 = game.createCard2("mrkuanggu", "club", 9);
			var card2 = game.createCard2("mrfangyuanchui", "heart", 3);
			var card3 = game.createCard2("mrdizang", "diamond", 12);
			var card4 = game.createCard2("mrsanwei", "spade", 13);
			var card5 = game.createCard2("mryingshengchong", "spade", 1);
			cards = [card1, card2, card3, card4, card5];
			let dialog = ui.create.dialog("御魂：请选择至多两项置入装备区");
			dialog.add([cards, "vcard"]);
			var next = player.chooseButton(dialog, [1, 2]).set("ai", function (button) {
				return !player.countCards("e", button.link.name);
			});
			const result = await next.forResult();
			if (result.bool) {
				for (var i of result.links) await player.equip(i);
			} else return;
		},
		derivation: ["mr_kuanggu", "mr_fangyuanchui", "mr_dizang", "mr_sanwei", "mrxiezhan"],
		group: "mryuhun_destroy",
		subSkill: {
			destroy: {
				trigger: {
					global: ["loseEnd", "equipEnd", "addJudgeEnd", "gainEnd", "loseAsyncEnd", "addToExpansionEnd"],
				},
				forced: true,
				filter(event, player) {
					var list = ["mrkuanggu", "mrfangyuanchui", "mrdizang", "mrsanwei", "mryingshengchong"];
					return game.hasPlayer(current => {
						var evt = event.getl(current);
						if (evt && evt.es) return evt.es.some(i => list.includes(i.name));
						return false;
					});
				},
				content() {
					var list = ["mrkuanggu", "mrfangyuanchui", "mrdizang", "mrsanwei", "mryingshengchong"];
					var cards = [];
					game.countPlayer(current => {
						var evt = trigger.getl(current);
						if (evt && evt.es) return cards.addArray(evt.es.filter(i => list.includes(i.name)));
					});
					game.cardsGotoSpecial(cards);
					game.log(cards, "被销毁了");
				},
				sub: true,
				sourceSkill: "mrtianlai",
				_priority: 0,
			},
		},
		ai: {
			order: 9,
			result: {
				player: 8,
			},
		},
	},
	mrlanpiao: {
		persevereSkill: true,
		enable: "phaseUse",
		limited: true,
		skillAnimation: true,
		animationColor: "thunder",
		filterCard: () => false,
		selectCard: [-1, -2],
		filterTarget: function (card, player, target) {
			if (target.hasSkill("共享")) return false;
			return target != player;
		},
		selectTarget: -1,
		async contentBefore(event, trigger, player) {
			player.changeSkin({ characterName: "mr_huajiao" }, "mr_huajiao_final");
			player.awakenSkill("mrlanpiao");
		},
		async content(event, trigger, player) {
			const target = event.target;
			await target.discard(target.getDiscardableCards(target, "ej", true));
			let num = target.countCards("h");
			if (num > 1) await target.chooseToDiscard(num - 1, "h", true);
			else if (num == 0) await target.draw();
		},
		async contentAfter(event, trigger, player) {
			game.addGlobalSkill("mrlanpiao_yuejianhei");
			player.$fullscreenpop("月见黑！", "thunder");
		},
		ai: {
			order: 9.5,
			result: {
				player(player) {
					let eff = 1;
					game.countPlayer(current => {
						const att = get.attitude(player, current);
						const delt = current.countCards("he") - 1;
						eff -= att * delt;
					});
					return eff > 0 ? 1 : 0;
				},
			},
		},
		subSkill: {
			yuejianhei: {
				trigger: {
					global: "phaseBegin",
				},
				forced: true,
				silent: true,
				firstDo: true,
				filter(event, player) {
					if (player.hasSkill("mrlanpiao") || player.hasSkill("共享")) return false;
					return player.countCards("h") != 1 || player.countDiscardableCards(player, "ej", true);
				},
				async content(event, trigger, player) {
					let p = player;
					await p.discard(p.getDiscardableCards(p, "ej", true));
					let num = p.countCards("h");
					if (num > 1) await p.chooseToDiscard(num - 1, "h", true);
					else if (num == 0) await p.draw("nodelay");
				},
				sub: true,
				sourceSkill: "mrlanpiao",
				popup: false,
				_priority: 1,
			},
		},
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => (player.storage[skill] = false),
		_priority: 0,
	},
	mr_kuanggu: {
		equipSkill: true,
		forced: true,
		trigger: {
			source: "damageBegin1",
		},
		filter: function (event, player) {
			return event.card && event.card.name == "sha";
		},
		async content(event, trigger, player) {
			let cards = player.getCards("h");
			let numm = cards.length;
			if (numm >= 2)
				await trigger.player.chooseToDiscard(1, true, "弃置一张手牌").set("ai", function (card) {
					return 7 - get.value(card);
				});
			if (numm >= 4)
				await trigger.player.chooseToDiscard(1, true, "弃置一张手牌").set("ai", function (card) {
					return 7 - get.value(card);
				});
			if (numm >= 5) trigger.num++;
		},
	},
	mr_sanwei: {
		equipSkill: true,
		forced: true,
		trigger: {
			player: "damageEnd",
		},
		filter: function (event, player) {
			return !player.hasSkill("mr_sanwei_use");
		},
		async content(event, trigger, player) {
			player.addSkill("mr_sanwei_use");
		},
		subSkill: {
			use: {
				forced: true,
				trigger: {
					player: "phaseBegin",
				},
				async content(event, trigger, player) {
					await player.removeSkill("mr_sanwei_use");
					await player.phaseUse();
				},
				mark: true,
				marktext: "味",
				intro: {
					content: "下个回合开始时，你执行一个额外的出牌阶段",
				},
			},
		},
	},
	mr_dizang: {
		forced: true,
		trigger: {
			player: "damageEnd",
		},
		async content(event, trigger, player) {
			const result = await player.judge().forResult();
			if (result.color == "red") await player.changeHujia();
		},
	},
	mrxingliu: {
		locked: true,
		trigger: {
			global: ["useCardAfter", "phaseEnd"],
		},
		filter: function (event, player) {
			if (event.player == player) return false;
			if (event.name === "phase") {
				let trick = true;
				event.player.hasHistory("useCard", function (evt) {
					if (trick && get.type2(evt.card, false) == "trick") trick = false;
				});
				return trick;
			}
			return player.countMark("mrxingliu_one") && event.player == _status.currentPhase && get.type(event.card) == "trick";
		},
		check: function (event, player) {
			if (player.storage.mrmingyun) {
				var eff = 0;
				game.players.forEach(p => {
					eff += get.effect(p, { name: "wanjian" }, player, player);
				});
				return eff;
			}
			return true;
		},
		async content(event, trigger, player) {
			await player.removeMark("mrxingliu_one", 1);
			if (player.storage.mrmingyun || player.countMark("mrxingliu_two") < 6) await player.addMark("mrxingliu_two", 1);
			var card = {};
			if (player.storage.mrmingyun) card = { name: "wanjian", isCard: true };
			else card = { name: "sha", isCard: true };
			if (player.storage.mrmingyun) player.chooseUseTarget(card, true);
			else {
				const targets = await player
					.chooseTarget(1, "选择【" + get.translation(card.name) + "】的目标", function (ccard, player, target) {
						return player.canUse(card, target, false);
					})
					.set("ai", function (target) {
						return 1 + get.effect(target, card, player, player);
					})
					.forResultTargets();
				player.useCard(card, targets, false).card.mrxingliu1 = true;
			}
		},
		prompt2(event, player) {
			var str = player.storage.mrmingyun ? "使用一张【万箭齐发】" : "对一名角色使用一张无视防具无距离限制的【杀】";
			return "每回合限一次，其他角色在回合内使用锦囊牌后，你可以视为" + str + "，并将一层“命运星河”转换为“星辰之力”。";
		},
		onremove: function (player, skill) {
			if (player.hasMark("mrxingliu_one")) player.removeMark("mrxingliu_one", player.countMark("mrxingliu_one"));
			if (player.hasMark("mrxingliu_two")) player.removeMark("mrxingliu_two", player.countMark("mrxingliu_two"));
		},
		ai: {
			unequip: true,
			skillTagFilter: function (player, tag, arg) {
				if (!arg || !arg.card || arg.card.mrxingliu1 != true) return false;
			},
		},
		group: ["mrxingliu_one", "mrxingliu_two", "mrxingliu_gain"],
		subSkill: {
			one: {
				forced: true,
				init: function (player) {
					player.addMark("mrxingliu_one", 6);
				},
				marktext: "星",
				intro: {
					name: "命运星河",
					content: function (storage, player) {
						return "当前命运星河层数：" + player.countMark("mrxingliu_one") + "层";
					},
				},
			},
			two: {
				forced: true,
				marktext: "辰",
				intro: {
					name: "星辰之力",
					content: function (storage, player) {
						return "当前星辰之力层数：" + player.countMark("mrxingliu_two") + "层";
					},
				},
			},
			gain: {
				trigger: {
					player: "phaseZhunbei",
				},
				check: function (event, player) {
					return player.countMark("mrxingliu_one") < 3;
				},
				filter: function (event, player) {
					return player.countMark("mrxingliu_one") < 6;
				},
				async content(event, trigger, player) {
					await player.skip("phaseUse");
					await player.skip("phaseDiscard");
					let num = player.countMark("mrxingliu_one");
					await player.addMark("mrxingliu_one", 6 - num);
				},
				prompt: "准备阶段，你可以跳过出牌和弃牌阶段，将“命运星河”补充至6。",
			},
		},
	},
	mrtingji: {
		locked: true,
		trigger: {
			player: "useCard2",
		},
		filter: function (event, player) {
			return (event.card.name == "sha" || (get.type(event.card) == "trick" && get.tag(event.card, "damage") > 0)) && player.countMark("mrxingliu_two");
		},
		check: function (event, player) {
			return player.storage.mrmingyun && player.countMark("mrxingliu_two") >= 2;
		},
		async content(event, trigger, player) {
			let result = {};
			if (player.storage.mrmingyun)
				result = await player
					.chooseNumbers('移除至多两层"星辰之力"，若：不小于2，摸两张牌；不小于2，为此牌减少两个目标；不小于2，此牌的伤害加二', [{ prompt: '请选择你要移除的"星辰之力"的层数', min: 0, max: Math.min(player.storage.mrxingliu_two, 2) }])
					.set("processAI", () => {
						return [2];
					})
					.forResult();
			else result = await player.chooseNumbers('移除至多三层"星辰之力"，若：不小于1，摸一张牌；不小于2，为此牌添加一个目标；不小于3，此牌的伤害加一', [{ prompt: '请选择你要移除的"星辰之力"的层数', min: 0, max: Math.min(player.storage.mrxingliu_two, 3) }]).forResult();
			let num = result.bool ? result.numbers[0] : 0;
			await player.removeMark("mrxingliu_two", num);
			if (player.storage.mrmingyun) {
				if (num < 2) return;
				await player.draw(2);
				var result2 = await player
					.chooseTarget([1, 2], "霆击：为" + get.translation(trigger.card) + "减少两个额外目标。", function (card, player, target) {
						return trigger.targets.includes(target);
					})
					.set("ai", function (target) {
						var player = _status.event.player;
						return -get.effect(target, trigger.card, player, player);
					})
					.set("card", trigger.card)
					.forResult();
				if (result2.bool) {
					for (var i of result2.targets) trigger.targets.remove(i);
				}
				trigger.baseDamage += 2;
				if (player.countMark("mrxingliu_one")) player.addMark("mrxingliu_one", 2);
			} else {
				if (num >= 1) {
					await player.draw(1);
				}
				if (num >= 2) {
					var result2 = await player
						.chooseTarget("霆击：为" + get.translation(trigger.card) + "增加一个额外目标（无距离限制）。", function (card, player, target) {
							return !trigger.targets.includes(target) && player.canUse(trigger.card, target, false);
						})
						.forResult();
					if (result2.bool) trigger.targets.push(result2.targets[0]);
				}
				if (num >= 3) {
					trigger.baseDamage++;
					if (player.countMark("mrxingliu_one") && player.countMark("mrxingliu_two") < 6) player.addMark("mrxingliu_one", 1);
				}
			}
		},
	},
	mrmingyun: {
		skillAnimation: true,
		animationColor: "thunder",
		unique: true,
		juexingji: true,
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		filter: function (event, player) {
			return player.countMark("mrxingliu_two") == 6;
		},
		content() {
			player.awakenSkill("mrmingyun");
			player.recover(player.maxHp - player.hp);
			player.storage.mrmingyun = 1;
		},
	},
	mryehuo: {
		chargeSkill: 4,
		trigger: {
			global: "roundStart",
			player: "phaseBegin",
		},
		marktext: "离",
		intro: {
			content: "使用【杀】时额外结算一次",
			markcount: function () {
				return 0;
			},
		},
		filter: function (event, player) {
			return player.countCharge();
		},
		check: function (event, player) {
			return player.countCharge() > 1;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget([1, 2], "消耗1点蓄力值令至多两名角色获得“离”至你的下个回合开始", function (card, player, target) {
					return !target.hasMark("mryehuo");
				})
				.set("ai", function (target) {
					return 1 + get.attitude(player, target);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			let targets = event.targets;
			for (var target of targets) await target.addMark("mryehuo");
			await player.removeCharge();
		},
		onremove: function (player, skill) {
			game.countPlayer(p => {
				if (p.hasMark("mryehuo")) p.removeMark("mryehuo");
			});
		},
		derivation: "mrjinran",
		group: ["mryehuo_init", "mryehuo_charge", "mryehuo_sha", "mryehuo_delete"],
		subSkill: {
			init: {
				trigger: {
					player: "enterGame",
					global: "phaseBefore",
				},
				filter(event, player) {
					if (!player.countCharge(true)) return false;
					return event.name != "phase" || game.phaseNumber == 0;
				},
				forced: true,
				locked: false,
				content() {
					player.addCharge(3);
				},
				sub: true,
				_priority: 0,
			},
			charge: {
				forced: true,
				locked: false,
				trigger: {
					player: "phaseUseEnd",
				},
				async content(event, trigger, player) {
					let num = 0;
					let num1 = await player.getHistory("useCard", function (evt) {
						if (evt.targets && evt.targets.length && evt.isPhaseUsing()) {
							var targets = evt.targets.slice(0);
							while (targets.includes(player)) targets.remove(player);
							return targets.length > 0;
						}
						return false;
					}).length;
					if (!player.getStat("damage")) num++;
					if (num1 == 0) num++;
					if (num) await player.addCharge(num);
				},
			},
			sha: {
				forced: true,
				locked: false,
				trigger: {
					global: "useCard",
				},
				filter: function (event, player) {
					return get.name(event.card) == "sha" && event.player.hasMark("mryehuo");
				},
				async content(event, trigger, player) {
					trigger.effectCount += 1;
					player.draw();
				},
			},
			delete: {
				forced: true,
				locked: false,
				trigger: {
					player: "phaseBefore",
				},
				filter: function (event, player) {
					return game.countPlayer(p => {
						return p.hasMark("mryehuo");
					});
				},
				async content(event, trigger, player) {
					game.countPlayer(p => {
						if (p.hasMark("mryehuo")) p.removeMark("mryehuo");
					});
				},
			},
		},
	},
	mrlishang: {
		skillAnimation: true,
		animationColor: "thunder",
		unique: true,
		juexingji: true,
		trigger: {
			player: "dying",
		},
		forced: true,
		async content(event, trigger, player) {
			player.awakenSkill("mrlishang");
			player.storage.mrjinran = player.countCharge();
			let cards = player.getCards("hej");
			await player.discard(cards);
			await player.gainMaxHp();
			let num = player.maxHp;
			await player.recoverTo(num);
			await player.draw(num);
			await player.removeSkill("mryehuo");
			await player.addSkill("mrjinran");
			player.changeSkin({ characterName: "mr_buzhihuo" }, "mr_buzhihuo_awaken");
		},
	},
	mrjinran: {
		forced: true,
		trigger: {
			global: "phaseEnd",
		},
		async content(event, trigger, player) {
			if (player.hp < player.maxHp) await player.recover();
			if (trigger.player == player) await player.loseMaxHp();
		},
		group: "mrjinran_wan",
		subSkill: {
			wan: {
				enable: "phaseUse",
				usable: 1,
				viewAs: {
					name: "wanjian",
				},
				filterCard: () => false,
				selectCard: [-1, -2],
				onuse: function (result, player) {
					player.draw(player.storage.mrjinran);
				},
			},
		},
		ai: {
			basic: {
				order: 8.5,
				useful: 1,
				value: 5,
			},
			wuxie(target, card, player, viewer, status) {
				let att = get.attitude(viewer, target),
					eff = get.effect(target, card, player, target);
				if (Math.abs(att) < 1 || status * eff * att >= 0) return 0;
				let evt = _status.event.getParent("useCard"),
					pri = 1,
					bonus = player.hasSkillTag("damageBonus", true, {
						target: target,
						card: card,
					}),
					damage = 1,
					isZhu = function (tar) {
						return tar.isZhu || tar === game.boss || tar === game.trueZhu || tar === game.falseZhu;
					},
					canShan = function (tar, blur) {
						let known = tar.getKnownCards(viewer);
						if (!blur)
							return known.some(card => {
								let name = get.name(card, tar);
								return (name === "shan" || name === "hufu") && lib.filter.cardRespondable(card, tar);
							});
						if (tar.countCards("hs", i => !known.includes(i)) > 3.67 - (2 * tar.hp) / tar.maxHp) return true;
						if (!tar.hasSkillTag("respondShan", true, "respond", true)) return false;
						if (tar.hp <= damage) return false;
						if (tar.hp <= damage + 1) return isZhu(tar);
						return true;
					},
					self = false;
				if (canShan(target)) return 0;
				if (
					bonus &&
					!viewer.hasSkillTag("filterDamage", null, {
						player: player,
						card: card,
					})
				)
					damage = 2;
				if ((viewer.hp <= damage || (viewer.hp <= damage + 1 && isZhu(viewer))) && !canShan(viewer)) {
					if (viewer === target) return status;
					let fv = true;
					if (evt && evt.targets)
						for (let i of evt.targets) {
							if (fv) {
								if (target === i) fv = false;
								continue;
							}
							if (viewer == i) {
								if (isZhu(viewer)) return 0;
								self = true;
								break;
							}
						}
				}
				let mayShan = canShan(target, true);
				if (
					bonus &&
					!target.hasSkillTag("filterDamage", null, {
						player: player,
						card: card,
					})
				)
					damage = 2;
				else damage = 1;
				if (isZhu(target)) {
					if (eff < 0) {
						if (target.hp <= damage + 1 || (!mayShan && target.hp <= damage + 2)) return 1;
						if (mayShan && target.hp > damage + 2) return 0;
						else if (mayShan || target.hp > damage + 2) pri = 3;
						else pri = 4;
					} else if (target.hp > damage + 1) pri = 2;
					else return 0;
				} else if (self) return 0;
				else if (eff < 0) {
					if (!mayShan && target.hp <= damage) pri = 5;
					else if (mayShan) return 0;
					else if (target.hp > damage + 1) pri = 2;
					else if (target.hp === damage + 1) pri = 3;
					else pri = 4;
				} else if (target.hp <= damage) return 0;
				let find = false;
				if (evt && evt.targets)
					for (let i = 0; i < evt.targets.length; i++) {
						if (!find) {
							if (evt.targets[i] === target) find = true;
							continue;
						}
						let att1 = get.attitude(viewer, evt.targets[i]),
							eff1 = get.effect(evt.targets[i], card, player, evt.targets[i]),
							temp = 1;
						if (Math.abs(att1) < 1 || att1 * eff1 >= 0 || canShan(evt.targets[i])) continue;
						mayShan = canShan(evt.targets[i], true);
						if (
							bonus &&
							!evt.targets[i].hasSkillTag("filterDamage", null, {
								player: player,
								card: card,
							})
						)
							damage = 2;
						else damage = 1;
						if (isZhu(evt.targets[i])) {
							if (eff1 < 0) {
								if (evt.targets[i].hp <= damage + 1 || (!mayShan && evt.targets[i].hp <= damage + 2)) return 0;
								if (mayShan && evt.targets[i].hp > damage + 2) continue;
								if (mayShan || evt.targets[i].hp > damage + 2) temp = 3;
								else temp = 4;
							} else if (evt.targets[i].hp > damage + 1) temp = 2;
							else continue;
						} else if (eff1 < 0) {
							if (!mayShan && evt.targets[i].hp <= damage) temp = 5;
							else if (mayShan) continue;
							else if (evt.targets[i].hp > damage + 1) temp = 2;
							else if (evt.targets[i].hp === damage + 1) temp = 3;
							else temp = 4;
						} else if (evt.targets[i].hp > damage + 1) temp = 2;
						if (temp > pri) return 0;
					}
				return 1;
			},
			result: {
				player(player, target) {
					if (player._wanjian_temp || player.hasSkillTag("jueqing", false, target)) return 0;
					if (target.hp > 2 || (target.hp > 1 && !target.isZhu && target != game.boss && target != game.trueZhu && target != game.falseZhu)) return 0;
					player._wanjian_temp = true;
					let eff = get.effect(target, new lib.element.VCard({ name: "wanjian" }), player, target);
					delete player._wanjian_temp;
					if (eff >= 0) return 0;
					if (target.hp > 1 && target.hasSkillTag("respondShan", true, "respond", true)) return 0;
					let known = target.getKnownCards(player);
					if (
						known.some(card => {
							let name = get.name(card, target);
							if (name === "shan" || name === "hufu") return lib.filter.cardRespondable(card, target);
							if (name === "wuxie") return lib.filter.cardEnabled(card, target, "forceEnable");
						})
					)
						return 0;
					if (target.hp > 1 || target.countCards("hs", i => !known.includes(i)) > 3.67 - (2 * target.hp) / target.maxHp) return 0;
					let res = 0,
						att = get.sgnAttitude(player, target);
					res -= att * (0.8 * target.countCards("hs") + 0.6 * target.countCards("e") + 3.6);
					if (get.mode() === "identity" && target.identity === "fan") res += 2.4;
					if ((get.mode() === "guozhan" && player.identity !== "ye" && player.identity === target.identity) || (get.mode() === "identity" && player.identity === "zhu" && (target.identity === "zhong" || target.identity === "mingzhong"))) res -= 0.8 * player.countCards("he");
					return res;
				},
				target(player, target) {
					let zhu = (get.mode() === "identity" && target.isZhu) || target.identity === "zhu";
					if (!lib.filter.cardRespondable({ name: "shan" }, target)) {
						if (zhu) {
							if (target.hp < 2) return -99;
							if (target.hp === 2) return -3.6;
						}
						return -2;
					}
					let known = target.getKnownCards(player);
					if (
						known.some(card => {
							let name = get.name(card, target);
							if (name === "shan" || name === "hufu") return lib.filter.cardRespondable(card, target);
							if (name === "wuxie") return lib.filter.cardEnabled(card, target, "forceEnable");
						})
					)
						return -1.2;
					let nh = target.countCards("hs", i => !known.includes(i));
					if (zhu && target.hp <= 1) {
						if (nh === 0) return -99;
						if (nh === 1) return -60;
						if (nh === 2) return -36;
						if (nh === 3) return -8;
						return -5;
					}
					if (target.hasSkillTag("respondShan", true, "respond", true)) return -1.35;
					if (!nh) return -2;
					if (nh === 1) return -1.65;
					return -1.5;
				},
			},
			tag: {
				respond: 1,
				respondShan: 1,
				damage: 1,
				multitarget: 1,
				multineg: 1,
			},
		},
	},
	mrchuannu: {
		init: function (player) {
			_status.mrchuannu = 0;
		},
		marktext: "怒",
		intro: {
			name: "川怒",
			content: function (storage, player) {
				return "当前川怒层数：" + player.countMark("mrchuannu") + "层";
			},
		},
		group: ["mrchuannu_die", "mrchuannu_gain", "mrchuannu_kill"],
		subSkill: {
			yilibudao: {
				trigger: {
					global: "roundStart",
				},
				forced: true,
				silent: true,
				firstDo: true,
				async content(event, trigger, player) {
					const {
						result: { bool: chooseToDiscardResultBool },
					} = await player.chooseToDiscard(_status.mrchuannu).set("ai", card => {
						if (card.name == "tao") return -10;
						if (card.name == "jiu" && player.hp == 1) return -10;
						return get.unuseful(card) + 2.5 * (5 - get.owner(card).hp);
					});
					if (chooseToDiscardResultBool === false) {
						player.loseHp();
					}
				},
			},
			die: {
				forced: true,
				locked: true,
				trigger: {
					player: "die",
				},
				forceDie: true,
				async content(event, trigger, player) {
					_status.mrchuannu = await player.countMark("mrchuannu");
					const result = await player
						.chooseTarget("你选择一名角色令其回复" + _status.mrchuannu + "点体力，然后令场上获得“屹立不倒”光环效果(每轮游戏开始时，所有角色弃置" + _status.mrchuannu + "X张牌，否则失去一点体力)")
						.set("ai", function (target) {
							return 1 + get.attitude(player, target);
						})
						.forResult();
					if (result.bool) await result.targets[0].recover(_status.mrchuannu);
					game.addGlobalSkill("mrchuannu_yilibudao");
					player.$fullscreenpop("屹立不倒！", "thunder");
				},
			},
			gain: {
				forced: true,
				locked: true,
				trigger: {
					player: ["damageEnd", "loseHpEnd"],
				},
				filter: function (event, player) {
					return player.maxHp - player.hp == 1 || player.hp == 1 || event.num >= 2;
				},
				async content(event, trigger, player) {
					let num = 0,
						num1 = player.countMark("mrchuannu");
					if (player.maxHp - player.hp == 1) num++;
					if (player.hp == 1) num++;
					if (trigger.num >= 2) num++;
					let numm = Math.min(num, 3 - player.countMark("mrchuannu"));
					await player.addMark("mrchuannu", numm);
					let skills = ["mrchuannu_one", "mrchuannu_two", "mrchuannu_three"].slice(num1, player.countMark("mrchuannu"));
					await player.addSkills(skills);
					let cards = await player.getCards("j");
					if (cards) await player.discard(cards);
					await player.phaseUse();
				},
			},
			one: {
				equipSkill: true,
				forced: true,
				inherit: "mr_kuanggu",
				trigger: {
					source: "damageBegin1",
				},
				filter: function (event, player) {
					if (!lib.skill.mr_kuanggu.filter(event, player)) return false;
					if (!player.hasEmptySlot(1)) return false;
					return true;
				},
				async content(event, trigger, player) {
					let cards = player.getCards("h");
					let numm = cards.length;
					if (numm >= 2)
						await trigger.player.chooseToDiscard(1, true, "弃置一张手牌").set("ai", function (card) {
							return 7 - get.value(card);
						});
					if (numm >= 4)
						await trigger.player.chooseToDiscard(1, true, "弃置一张手牌").set("ai", function (card) {
							return 7 - get.value(card);
						});
					if (numm >= 5) trigger.num++;
				},
				mod: {
					globalFrom: function (from, to, distance) {
						var es = from.countMark("mrchuannu");
						return distance - es; //例子，进攻距离+1
					},
				},
			},
			two: {
				forced: true,
				trigger: {
					player: "phaseBegin",
				},
				content() {
					player.draw(player.countMark("mrchuannu"));
				},
			},
			three: {
				forced: true,
				trigger: {
					player: "damageBegin",
					source: "damageBegin",
				},
				content() {
					trigger.num++;
				},
			},
			kill: {
				trigger: {
					source: "dieAfter",
				},
				forced: true,
				async content(event, trigger, player) {
					let num = await player.countMark("mrchuannu"),
						skills = ["mrchuannu_one", "mrchuannu_two", "mrchuannu_three"];
					await player.removeMark("mrchuannu");
					player.removeSkill(skills[num - 1]);
					await player.draw(2);
				},
			},
		},
	},
	mrhaizhan: {
		enable: "phaseUse",
		usable: 1,
		filter: function (event, player) {
			return player.countMark("mrchuannu");
		},
		async content(event, trigger, player) {
			const result = await player
				.chooseTarget(1, get.prompt2("mrhaizhan"), function (card, player, target) {
					return player != target;
				})
				.set("ai", function (target) {
					return 1 - get.attitude(player, target);
				})
				.forResult();
			if (!result.bool) return;
			let target = result.targets[0],
				num = player.countMark("mrchuannu");
			await player.useCard({ name: "sha", isCard: true }, target, false);
			if (num >= 2) await player.useCard({ name: "juedou", isCard: true }, target, false);
			if (num >= 3) await target.addSkill("mrguli");
		},
		ai: {
			result: {
				target(player, target) {
					let eff = 0,
						num = player.countMark("mrchuannu");
					if (num >= 1) eff -= get.effect(target, { name: "sha" }, player, player);
					if (num >= 2) eff -= get.effect(target, { name: "juedou" }, player, player);
					if (num >= 3) eff -= 4;
					return eff;
				},
			},
		},
	},
	mrguli: {
		global: "mrguli_not",
		subSkill: {
			not: {
				mod: {
					cardSavable(card, player, target) {
						if (card.name == "tao" && target != player && target.hasSkill("mrguli")) return false;
					},
				},
			},
		},
	},
	mrjiliu: {
		forced: true,
		mark: true,
		locked: true,
		zhuanhuanji: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				let str = player.storage.mrjiliu ? "当你造成伤害时，伤害加X(X为目标的已损体值)" : "当你造成伤害时，伤害加Y(Y为你的已损体力值)";
				return str;
			},
			markcount: function () {
				return 0;
			},
		},
		init: function (player, skill) {
			player.storage.mrjiliu = 1;
		},
		trigger: {
			source: "damageBegin",
		},
		async content(event, trigger, player) {
			let target = trigger.player;
			if (player.storage.mrjiliu) trigger.num += target.maxHp - target.hp;
			else trigger.num += player.maxHp - player.hp;
			await player.changeZhuanhuanji("mrjiliu");
		},
	},
	mrtunshi: {
		usable: function (skill, player) {
			return player.maxHp - player.hp;
		},
		trigger: {
			player: "useCardToPlayered",
		},
		filter: function (event, player) {
			return (event.card.name == "sha" || (get.type(event.card) == "trick" && get.tag(event.card, "damage") > 0)) && player.maxHp > player.hp;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2("mrtunshi"), function (card, player, target) {
					return trigger.targets.includes(target) && target.countGainableCards("hej");
				})
				.set("ai", function (target) {
					return 1 - get.attitude(player, target);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			let target = event.targets[0],
				num = Math.min(player.maxHp - player.hp, target.countGainableCards("hej"));
			if (num) await player.gainPlayerCard("hej", target, num);
			if (player.countCards("h") == player.hp || target.countCards("h") == target.hp) await target.loseHp();
		},
	},
	mrtiebi: {
		forced: true,
		locked: true,
		trigger: {
			player: "loseHpBegin",
		},
		async content(event, trigger, player) {
			let num = trigger.num;
			await player.changeHujia(num);
			if (num >= player.hp) trigger.num = player.hp - 1;
		},
	},
	mrzhanqi: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: false,
		init: function (player) {
			player.storage.mrzhanqi = 1;
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async content(event, trigger, player) {
			const result = await player
				.chooseTarget("战旗:选择一名其他角色成为“血色”", lib.translate.mrzhanqi_info, true, function (card, player, target) {
					return player != target;
				})
				.set("ai", function (target) {
					return 1 + get.attitude(player, target);
				})
				.forResult();
			let target = result.targets[0];
			player.storage.mrzhanqi_tag = target;
			player.addSkill("mrzhanqi_tag");
		},
		group: ["mrzhanqi_damage", "mrzhanqi_use", "mrzhanqi_save"],
		subSkill: {
			tag: {
				charlotte: true,
				onremove: true,
				mark: "character",
				sourceSkill: "mrzhanqi",
				intro: {
					content: "①当$受到大于1点的伤害时，你以失去体力的形式分担超过1点的伤害部分。②每轮限一次，$的回合结束后，你执行一个额外的出牌阶段。③本局游戏限一次，当$即将因受到伤害或者失去体力而进入濒死状态时，你取消之并令其获得三点护甲。",
				},
			},
			damage: {
				forced: true,
				locked: true,
				trigger: {
					global: "damageBegin1",
				},
				filter: function (event, player) {
					return event.player == player.storage.mrzhanqi_tag && event.num > 1;
				},
				async content(event, trigger, player) {
					let num = trigger.num;
					trigger.num = 1;
					await player.loseHp(num - 1);
				},
			},
			use: {
				forced: true,
				locked: true,
				trigger: {
					global: "phaseEnd",
				},
				filter: function (event, player) {
					return event.player == player.storage.mrzhanqi_tag;
				},
				async content(event, trigger, player) {
					await player.phaseUse();
				},
			},
			save: {
				trigger: {
					global: ["damageBegin2", "loseHpBegin"],
				},
				filter: function (event, player) {
					let p = event.player;
					return p == player.storage.mrzhanqi_tag && event.num >= p.hp && player.storage.mrzhanqi && !p.isUnseen();
				},
				async content(event, trigger, player) {
					let p = trigger.player;
					await trigger.cancel();
					await p.changeHujia(3);
					player.storage.mrzhanqi = 0;
				},
				prompt: "本局游戏限一次，当“血色”即将因受到伤害或者失去体力而进入濒死状态时，你可以取消之并令“血色”获得三点护甲。",
				_priority: -10,
			},
		},
	},
	mrhuangquan: {
		enable: "phaseUse",
		usable: 1,
		async content(event, trigger, player) {
			const result = await player
				.chooseTarget(get.prompt2("mrhuangquan"))
				.set("ai", function (target) {
					return 1 - get.attitude(player, target);
				})
				.forResult();
			if (result.bool) {
				await player.loseHp();
				await result.targets[0].loseHp();
			}
		},
	},
	mrchise: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: true,
		derivation: ["mrhuajin", "mrchenmian"],
		global: ["mrhuajin", "mrhuajin_discard"],
		init: function (player) {
			player.storage.mrchise = 0;
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async content(event, trigger, player) {
			let players = game.filterPlayer(p => {
					return p != player;
				}),
				num = 6;
			players.sort((a, b) => {
				return Math.random() - 0.5;
			});
			while (num) {
				for (var j = 0; j < 6; j++) {
					let bool = 0;
					for (var i of players) {
						if (i.countMark("mrchise_mingzhong") == j) {
							i.addMark("mrchise_mingzhong", 1, false);
							num--;
							bool = 1;
							break;
						}
					}
					if (bool) break;
				}
			}
			await player.loseHp(2);
			await player.addSkill(["mrchenmian"]);
		},
		group: ["mrchise_end"],
		subSkill: {
			mingzhong: {
				marktext: "种",
				intro: {
					name: "溟种",
					content: "当前共有#个溟种",
				},
			},
			minghua: {
				marktext: "花",
				intro: {
					name: "溟花",
					content: "当前共有#个溟花",
				},
			},
			end: {
				forced: true,
				trigger: {
					player: "phaseEnd",
				},
				async content(event, trigger, player) {
					var list = ["1.失去两点体力并获得【沉眠】，重复【赤色】描述①", "2.对一名其他角色造成1点伤害并摸X张牌（X为你的“溟花”数），然后弃置所有“溟花”"];
					var choiceList = ui.create.dialog("沉眠：请选择与上一次不同的一项", "forcebutton", "hidden");
					choiceList.add([
						list.map((item, i) => {
							if (player.storage.mrchise == i) item = `<span style="text-decoration: line-through;">${item}</span>`;
							return [i, item];
						}),
						"textbutton",
					]);
					const result = await player
						.chooseButton(choiceList, 1, true)
						.set("filterButton", function (button) {
							if (player.storage.mrchise == button.link) return false;
							return true;
						})
						.forResult();
					if (result.links[0] == 0) {
						await player.loseHp(2);
						await player.addSkill(["mrchenmian"]);
						let players = game.filterPlayer(p => {
								return p != player;
							}),
							num = 6;
						players.sort((a, b) => {
							return Math.random() - 0.5;
						});
						while (num) {
							for (var j = 0; j < 6; j++) {
								let bool = 0;
								for (var i of players) {
									if (i.countMark("mrchise_mingzhong") == j) {
										i.addMark("mrchise_mingzhong", 1, false);
										num--;
										bool = 1;
										break;
									}
								}
								if (bool) break;
							}
						}
						player.storage.mrchise = 0;
					} else {
						const result2 = await player
							.chooseTarget("对一名其他角色造成1点伤害并摸X张牌（X为你的“溟花”数），然后弃置所有“溟花”", true, function (card, player, target) {
								return player != target;
							})
							.set("ai", function (target) {
								return 1 - get.attitude(player, target);
							})
							.forResult();
						let target = result2.targets[0],
							num = player.countMark("mrchise_minghua");
						await target.damage(player);
						await player.draw(num);
						await player.removeMark("mrchise_minghua", num);
						player.storage.mrchise = 1;
					}
				},
			},
		},
	},
	mrchenmian: {
		forced: true,
		locked: true,
		mark: true,
		marktext: "眠",
		intro: {
			name: "沉眠",
			content: function (storage, player) {
				let str = "";
				if ([player.name1, player.name2].includes("mr_yemingbianhua")) str = "夜溟彼岸花";
				else str = get.translation(player.name1);
				return str + "正在沉睡中，即将受到伤害时，取消之";
			},
			markcount: function () {
				return 0;
			},
		},
		trigger: {
			player: "damageBegin2",
		},
		content() {
			trigger.cancel();
		},
		ai: {
			nodamage: true,
		},
		group: "mrchenmian_clear",
		subSkill: {
			clear: {
				forced: true,
				locked: true,
				trigger: {
					player: "mrdiaoling_discardAfter",
					global: "mrhuajin_discardAfter",
				},
				filter: function (event, player) {
					let players = game.filterPlayer(p => {
						return p.hasMark("mrchise_mingzhong");
					});
					return !players.length;
				},
				content() {
					player.removeSkill("mrchenmian");
				},
				_priority: -5,
			},
		},
	},
	mrdiaoling: {
		forced: true,
		locked: true,
		init: function (player) {
			_status.mrdiaoling = 0;
		},
		trigger: {
			player: "mrdiaoling_discardAfter",
			global: "mrhuajin_discardAfter",
		},
		filter: function (event, player) {
			return _status.mrdiaoling;
		},
		async content(event, trigger, player) {
			let num = _status.mrdiaoling;
			await player.addMark("mrchise_minghua", num);
			_status.mrdiaoling = 0;
		},
		group: "mrdiaoling_discard",
		subSkill: {
			discard: {
				forced: true,
				locked: true,
				trigger: {
					player: "phaseBeginStart",
				},
				async content(event, trigger, player) {
					game.players.forEach(p => {
						if (p.hasMark("mrchise_mingzhong")) {
							let num = p.countMark("mrchise_mingzhong");
							_status.mrdiaoling += num;
							p.removeMark("mrchise_mingzhong", num, false);
						}
					});
					await player.recover(Math.floor(_status.mrdiaoling / 2));
				},
			},
		},
	},
	mrhuajin: {
		trigger: {
			player: "phaseEnd",
		},
		forced: true,
		logTarget: "player",
		filter: function (event, player) {
			return player.hasMark("mrchise_mingzhong");
		},
		content() {
			let players = game.filterPlayer(p => {
				return p.hasSkill("mrchise");
			});
			player.damage(players[0]);
		},
		group: "mrhuajin_discard",
		subSkill: {
			discard: {
				trigger: {
					player: "phaseUseBegin",
				},
				filter: function (event, player) {
					return player.hasMark("mrchise_mingzhong") && player.countCards("he");
				},
				check: function (event, player) {
					let num = player.countMark("mrchise_mingzhong"),
						num1 = player.getCards("h").filter(card => {
							return get.name(card) == "tao";
						});
					if (num1.length) return false;
					if (player.countCards("he") < num) return false;
					if (player.countCards("h") - player.hp >= num) return true;
					if (
						player.getCards("h").some(card => {
							return get.name(card) == "jiu";
						}) &&
						player.hp == 1
					)
						return false;
					return true;
				},
				async content(event, trigger, player) {
					let cards = player.getCards("he"),
						num = player.countMark("mrchise_mingzhong");
					cards.sort(function (a, b) {
						return get.value(a) - get.value(b);
					});
					const result = await player
						.chooseCard([1, num], "he", true)
						.set("prompt2", "花烬：你可以弃置至多" + player.countMark("mrchise_mingzhong") + "张牌并弃置等量的“溟种”")
						.set("ai", function (card) {
							let num1 = ui.selected.cards.length;
							if (num1 == num) return false;
							if (cards.slice(0, num).includes(card)) return true;
							return false;
						})
						.forResult();
					let ccards = result.cards,
						nnum = ccards.length;
					await player.discard(ccards);
					await player.removeMark("mrchise_mingzhong", nnum);
					_status.mrdiaoling += nnum;
				},
				prompt2: "你可以弃置任意张牌并弃置等量的“溟种”",
			},
		},
	},
	mrwuyin: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: true,
		init: function (player) {
			if (typeof player.storage.mrwuyin_used === "undefined") player.storage.mrwuyin_used = 0;
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async content(event, trigger, player) {
			let str = ["gong", "shang", "jue", "zhi", "yu"];
			let cards = player.getCards("h").filter(card => !card.hasGaintag("共享"));
			cards.forEach(card => {
				player.addGaintag(card, "mrwuyin_" + str.randomGet());
			});
		},
		mark: true,
		marktext: "未",
		intro: {
			name: "顺序",
			content(storage, player, skill) {
				let str = ["当前未选择五音演奏顺序", "当前顺序为递减，使用“五音”相邻且递减的手牌不计入次数且摸一张牌", "当前顺序为递增，使用“五音”相邻且递增的手牌不计入次数且摸一张牌"];
				return str[player.storage.mrwuyin_used];
			},
		},
		isCorrectMelody(player, s1) {
			if (!player.storage.mrwuyin_used) return false;
			let melodies = {},
				str1 = ["shang", "jue", "zhi", "yu", "gong"],
				str2 = ["yu", "gong", "shang", "jue", "zhi"],
				str = ["gong", "shang", "jue", "zhi", "yu"];
			for (var i = 0; i < 5; i++) {
				let now = "mrwuyin_" + str[i];
				melodies[now + "_2"] = "mrwuyin_" + str1[i];
				melodies[now + "_1"] = "mrwuyin_" + str2[i];
			}
			return melodies[s1 + "_" + player.storage.mrwuyin_used];
		},
		group: ["mrwuyin_tag", "mrwuyin_end", "mrwuyin_effect"],
		subSkill: {
			tag: {
				silent: true,
				firstDo: true,
				trigger: {
					player: "gainAfter",
				},
				filter(event, player) {
					return event.getParent(2).name != "mrwuyin_end" && event.cards?.length;
				},
				async content(event, trigger, player) {
					let cards = trigger.cards;
					let str = ["gong", "shang", "jue", "zhi", "yu"];
					cards.forEach(card => {
						if (!card.gaintag.some(tag => tag.indexOf("mrwuyin_") == 0)) player.addGaintag(card, "mrwuyin_" + str.randomGet());
					});
				},
				sub: true,
				forced: true,
				locked: true,
				popup: false,
				_priority: 1,
			},
			end: {
				forced: true,
				locked: true,
				trigger: {
					global: "phaseEnd",
				},
				filter: function (event, player) {
					let has = [];
					player.countCards("h", card => {
						card.gaintag.some(tag => {
							if (tag.indexOf("mrwuyin_") == 0) has.add(tag);
						});
					});
					return has.length < 5;
				},
				async content(event, trigger, player) {
					let str = ["gong", "shang", "jue", "zhi", "yu"],
						shortage = [];
					for (var i = 0; i < 5; i++) {
						if (player.countCards("h", card => card.hasGaintag("mrwuyin_" + str[i]))) continue;
						shortage.add("mrwuyin_" + str[i]);
					}
					let cards = [];
					while (shortage.length) {
						let strr = shortage.shift();
						let card = get.cardPile2(c => !cards.includes(c) && !c.gaintag.some(tag => tag.indexOf("mrwuyin_") == 0));
						if (card) {
							card.addGaintag(strr);
							cards.push(card);
						} else break;
					}
					player.gain(cards, "gain2", "log");
				},
			},
			effect: {
				forced: false,
				locked: true,
				firstDo: true,
				trigger: {
					player: "phaseUseBegin",
				},
				async cost(event, trigger, player) {
					const result = await player.chooseControl(["递增", "递减", "cancel2"]).set("prompt", "是否发动【五音】").set("prompt2", "出牌阶段开始时，你可以选择递增/递减，则直到回合结束，你使用音律与上一张使用的牌的音律相邻且递增/递减的牌不计入次数，且摸一张牌").forResult();
					event.result = {
						bool: result.control != "cancel2",
						cost_data: result.control,
					};
				},
				async content(event, trigger, player) {
					let choose = event.cost_data;
					if (choose == "递增") player.storage.mrwuyin_used = 2;
					else if (choose == "递减") player.storage.mrwuyin_used = 1;
					player.addTempSkill("mrwuyin_use");
				},
			},
			use: {
				forced: true,
				locked: true,
				firstDo: true,
				mark: true,
				marktext: "未",
				intro: {
					name: "五音·使用",
					content(storage, player, skill) {
						return player.storage.mrwuyin_use;
					},
				},
				init: function (player) {
					player.storage.mrwuyin_use = "当前未使用“五音”，或使用的牌包含不同的“五音”";
					player.storage.mrwuyin_use_now = [];
					let str = ["", "rgb(46,107,213)", "rgb(213,107,46)"],
						choose = ["", "减", "增"],
						text = '<span style="color: ' + str[player.storage.mrwuyin_used] + '">' + choose[player.storage.mrwuyin_used] + "</span>";
					if (player.marks.mrwuyin) player.marks.mrwuyin.firstChild.innerHTML = text;
				},
				onremove: function (player, skill) {
					let text = '<span style="color: black">未</span>';
					if (player.marks.mrwuyin) player.marks.mrwuyin.firstChild.innerHTML = text;
					player.storage.mrwuyin_used = 0;
					player.storage.mrwuyin_use = "当前未演奏“五音”，或使用的牌包含不同的“五音”";
				},
				trigger: {
					player: "useCard1",
				},
				filter: function (event, player) {
					return (
						event.cards &&
						player.hasHistory("lose", evtx => {
							if ((evtx.relatedEvent || evtx.getParent()) === event) {
								Object.keys(evtx.gaintag_map).forEach(i => {
									evtx.gaintag_map[i].forEach(tag => {
										if (tag.indexOf("mrwuyin_") == 0) player.storage.mrwuyin_use_now.add(tag);
									});
								});
								return player.storage.mrwuyin_use_now.length;
							} else return false;
						})
					);
				},
				async content(event, trigger, player) {
					let cards = trigger.cards;
					if (player.storage.mrwuyin_use_now.length == 1) {
						let next = lib.skill.mrwuyin.isCorrectMelody(player, player.storage.mrwuyin_use_now[0]);
						let name = get.translation(next),
							name2 = get.translation(player.storage.mrwuyin_use_now[0]),
							text = '<span style="color: black">' + name + "</span>";
						if (player.storage.mrwuyin_use != "当前未演奏“五音”，或使用的牌包含不同的“五音”" && player.storage.mrwuyin_use.slice(15, 16) == name2) {
							if (trigger.addCount !== false) {
								trigger.addCount = false;
								const stat = player.getStat().card,
									name3 = trigger.card.name;
								if (typeof stat[name3] === "number") {
									stat[name3]--;
								}
							}
							player.draw();
						}
						if (player.marks.mrwuyin_use) player.marks.mrwuyin_use.firstChild.innerHTML = text;
						player.storage.mrwuyin_use = "当前已使用“" + name2 + "”，下一次使用“" + name + "”的牌将不计入次数并摸一张牌";
					} else {
						player.storage.mrwuyin_use = "当前未使用“五音”，或使用的牌包含不同的“五音”";
						let text = '<span style="color: black">未</span>';
						if (player.marks.mrwuyin_use) player.marks.mrwuyin_use.firstChild.innerHTML = text;
					}
					player.storage.mrwuyin_use_now.length = [];
				},
			},
		},
	},
	mrxuanxiang: {
		init: function (player) {
			if (typeof player.storage.mrxuanxiang_count === "undefined") player.storage.mrxuanxiang_count = 0;
		},
		trigger: {
			global: "phaseDrawBegin2",
		},
		filter(event, player) {
			return !event.numFixed && event.player.hasMark("mrxuanxiang_mark");
		},
		forced: true,
		locked: true,
		logTarget: "player",
		content() {
			trigger.num++;
		},
		global: "mrxuanxiang_mark",
		group: ["mrxuanxiang_gain", "mrxuanxiang_give", "mrxuanxiang_effect", "mrxuanxiang_sha"],
		subSkill: {
			sha: {
				forced: true,
				locked: true,
				trigger: {
					global: "useCardAfter",
				},
				filter: function (event, player) {
					return event.player != player && event.player.hasMark("mrxuanxiang_mark") && event.card.name == "sha" && event.targets.length == 1 && event.targets[0].isIn() && player.canUse({ name: "sha" }, event.targets[0], false);
				},
				async content(event, trigger, player) {
					player.useCard({ name: "sha" }, trigger.targets[0]);
					player.storage.mrxuanxiang_count++;
					trigger.player.storage.mrxuanxiang_counted++;
				},
			},
			gain: {
				trigger: {
					player: "phaseBegin",
				},
				filter(event, player) {
					return !game.hasPlayer(current => current.hasMark("mrxuanxiang_mark"));
				},
				forced: true,
				content() {
					player.addMark("mrxuanxiang_mark");
				},
				_priority: 0,
			},
			give: {
				trigger: {
					player: "phaseJieshuBegin",
				},
				filter(event, player) {
					return (
						player.hasMark("mrxuanxiang_mark") &&
						game.hasPlayer(target => {
							return target != player && !target.hasMark("mrxuanxiang_mark");
						})
					);
				},
				direct: true,
				content() {
					"step 0";
					player.chooseTarget(get.prompt("mrxuanxiang"), "将“玄象”交给一名其他角色；其摸牌阶段多摸一张牌，出牌阶段使用【杀】的次数上限+1。该角色使用【杀】指定唯一目标结算后，你视为对该目标使用一张【杀】。且该角色回合结束后，其移去“玄象”，你摸等同于“玄象”触发次数的牌。", function (card, player, target) {
						return target != player && !target.hasMark("mrxuanxiang_mark");
					}).ai = function (target) {
						return get.attitude(player, target);
					};
					("step 1");
					if (result.bool) {
						var target = result.targets[0];
						player.line(target);
						player.logSkill("mrxuanxiang", target);
						var mark = player.countMark("mrxuanxiang_mark");
						player.removeMark("mrxuanxiang_mark", mark);
						target.addMark("mrxuanxiang_mark", mark);
						target.storage.mrxuanxiang_counted = 0;
					}
				},
				ai: {
					effect: {
						player(card, player, target) {
							return 2;
						},
					},
				},
				_priority: 0,
			},
			effect: {
				lastDo: true,
				trigger: {
					global: "phaseEnd",
				},
				filter(event, player) {
					return player != event.player && event.player.hasMark("mrxuanxiang_mark") && event.player.isIn();
				},
				forced: true,
				logTarget: "player",
				content() {
					if (player.storage.mrxuanxiang_count) {
						player.draw(player.storage.mrxuanxiang_count);
						player.storage.mrxuanxiang_count = 0;
					}
					trigger.player.clearMark("mrxuanxiang_mark");
				},
				sub: true,
				_priority: 0,
			},
			mark: {
				marktext: "玄",
				intro: {
					name: "玄象",
					content: function (storage, player, skill) {
						let str = "";
						if (!player.hasSkill("mrxuanxiang")) str = "使用【杀】指定唯一目标结算后，拥有【玄象】的角色视为对该目标使用一张【杀】，且你回合结束后移去“玄象”，其摸等同于“玄象”触发次数的牌。<br><li>当前已触发" + player.storage.mrxuanxiang_counted + "次";
						return "<li>摸牌阶段多摸一张牌，出牌阶段使用【杀】的次数+1。" + str;
					},
					markcount() {
						return 0;
					},
				},
				mod: {
					cardUsable(card, player, num) {
						if (player.hasMark("mrxuanxiang_mark") && card.name == "sha") {
							return (
								num +
								game.countPlayer(function (current) {
									return current.hasSkill("mrxuanxiang");
								})
							);
						}
					},
					aiOrder(player, card, num) {
						if (
							player.hasMark("mrxuanxiang_mark") &&
							game.hasPlayer(current => {
								return current.hasSkill("mrxuanxiang") && get.attitude(player, current) <= 0;
							})
						) {
							return Math.max(num, 0) + 1;
						}
					},
				},
				ai: {
					nokeep: true,
					skillTagFilter(player) {
						return (
							player.hasMark("mrxuanxiang_mark") &&
							game.hasPlayer(current => {
								return current.hasSkill("mrxuanxiang") && get.attitude(player, current) <= 0;
							})
						);
					},
				},
				_priority: 0,
			},
		},
	},
	mrmoling: {
		forced: true,
		locked: true,
		init: function (player) {
			player.storage.mrmoling = 3;
		},
		mark: true,
		intro: {
			content: function (storage) {
				return "当前共有" + storage + "层“墨灵”";
			},
		},
		group: ["mrmoling_gain", "mrmoling_yihuo"],
		global: ["mrmoling_kuangmo"],
		subSkill: {
			gain: {
				forced: true,
				locked: true,
				usable: 1,
				trigger: {
					global: ["useSkill", "logSkill"],
				},
				filter: function (event, player) {
					let skill = get.sourceSkillFor(event);
					return event.player != player && skill != "mrmoling" && player.storage.mrmoling < 8;
				},
				async content(event, trigger, player) {
					player.storage.mrmoling++;
					player.updateMarks();
				},
			},
			yihuo: {
				forced: true,
				locked: true,
				marktext: "火",
				intro: {
					name: "义火",
					content: function (storage, player) {
						return "当前共有" + player.countMark("mrmoling_yihuo") + "点“义火”";
					},
				},
				trigger: {
					player: "mrmoling_gainAfter",
				},
				filter: function (event, player) {
					return player.storage.mrmoling == 8;
				},
				async content(event, trigger, player) {
					player.storage.mrmoling = 0;
					await player.addMark("mrmoling_yihuo", 3);
					await player.changeHujia();
					player.updateMarks();
				},
			},
			kuangmo: {
				mod: {
					cardname: function (card, player, name) {
						if (player.hasSkill("mrmoling") || name == "sha") return name;
						let bool = 0;
						game.players.forEach(p => {
							if (p.hasMark("mrmoling_yihuo")) bool = 1;
						});
						if (bool) return "mrkuangmo";
					},
				},
			},
		},
	},
	mrzhenyan: {
		trigger: {
			player: "phaseUseBegin",
		},
		async cost(event, trigger, player) {
			const list = [];
			list.push("选项一");
			list.push("选项二");
			list.push("cancel2");
			const control = await player
				.chooseControl(list)
				.set("choiceList", ["获得两点“义火”", "对一名其它角色造成1点不触发技能的伤害"])
				.set("prompt", get.prompt("mrzhenyan"))
				.set("ai", () => {
					let bool1 = Math.random() - 0.5;
					if (bool1 > 0) return "选项一";
					else return "选项二";
				})
				.forResultControl();
			const bo = control != "cancel2";
			event.result = {
				bool: bo,
				cost_data: control,
			};
		},
		async content(event, trigger, player) {
			const control = event.cost_data;
			if (control == "选项一") {
				await player.addMark("mrmoling_yihuo", 2);
			} else if (control == "选项二") {
				const targets = await player
					.chooseTarget(true, function (card, player, target) {
						return player != target;
					})
					.set("prompt2", "对一名其它角色造成1点不触发技能的伤害")
					.set("ai", function (target) {
						return 1 - get.attitude(player, target);
					})
					.forResultTargets();
				targets[0].damage(player, "notrigger");
			}
		},
	},
	mrpuxi: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: true,
		init: function (player) {
			player.storage.mrpuxi = [];
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async content(event, trigger, player) {
			const result = await player
				.chooseTarget([1, 2], "浦西：选择至多两名其他角色成为你的“研究生”", lib.translate.mrpuxi_info, true, function (card, player, target) {
					return player != target;
				})
				.set("ai", function (target) {
					return 1 - get.attitude(player, target);
				})
				.forResult();
			for (var i of result.targets) {
				i.addMark("mrpuxi_tag");
				player.storage.mrpuxi.add(i);
			}
		},
		mark: true,
		marktext: "浦",
		intro: {
			content: "已选$为你的“研究生”",
		},
		global: ["mryanbi", "mryanbi_draw", "mryanbi_cancel"],
		group: ["mrpuxi_dying", "mrpuxi_use"],
		derivation: "mryanbi",
		subSkill: {
			tag: {
				marktext: "研",
				intro: {
					content: "你已成为“研究生”",
					markcount() {
						return 0;
					},
				},
			},
			dying: {
				trigger: {
					global: "dying",
				},
				filter: function (event, player) {
					return event.player.hasMark("mrpuxi_tag");
				},
				async content(event, trigger, player) {
					let target = trigger.player;
					target.turnOver();
				},
				prompt2: function (event, player) {
					return "令" + get.translation(event.player) + "翻面";
				},
			},
			use: {
				trigger: {
					player: "phaseUseEnd",
				},
				usable: 1,
				async content(event, trigger, player) {
					await player.turnOver();
					player.phaseUse();
				},
				prompt2: "每回合限一次，出牌阶段结束时，你可以翻面并执行一个出牌阶段",
			},
		},
	},
	mryanbi: {
		forced: true,
		locked: true,
		trigger: {
			player: "phaseDrawBefore",
		},
		filter: function (event, player) {
			return player.hasMark("mrpuxi_tag");
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
		subSkill: {
			draw: {
				forced: true,
				locked: true,
				trigger: {
					player: "phaseUseEnd",
				},
				filter: function (event, player) {
					return player.hasMark("mrpuxi_tag");
				},
				async content(event, trigger, player) {
					player.draw();
				},
			},
			cancel: {
				forced: true,
				locked: true,
				trigger: {
					target: "useCardToBefore",
				},
				filter: function (event, player) {
					return player.hasMark("mrpuxi_tag") && get.type(event.card) == "delay";
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
			},
		},
	},
	mrgugu: {
		forced: true,
		locked: true,
		trigger: {
			global: "turnOverAfter",
		},
		async content(event, trigger, player) {
			let num1 = game.countPlayer(p => {
					return p.isTurnedOver();
				}),
				num2 = game.countPlayer(p => {
					return !p.isTurnedOver();
				});
			if (player.isTurnedOver()) await player.draw(Math.max(1, num1));
			else await player.draw(Math.max(1, num2));
			if (trigger.player.hasMark("mrpuxi_tag") && player.isTurnedOver()) await player.turnOver();
		},
	},
	mrkuaipao: {
		skillAnimation: true,
		animationColor: "thunder",
		unique: true,
		juexingji: true,
		forced: true,
		locked: true,
		trigger: {
			global: "die",
		},
		filter: function (event, player) {
			let num = game.countPlayer(p => {
				return p.hasMark("mrpuxi_tag");
			});
			return num == 0;
		},
		async content(event, trigger, player) {
			await player.awakenSkill("mrkuaipao");
			const result = await player
				.chooseTarget(get.prompt2("mrkuaipao"))
				.set("ai", function (target) {
					return 1 - get.attitude(player, target);
				})
				.forResult();
			if (result.bool) {
				let target = result.targets[0];
				let num = target.hp - 1;
				await target.damage(player, num);
			}
		},
	},
	mrfentian: {
		chargeSkill: 6,
		forced: true,
		locked: false,
		trigger: {
			player: "useCard",
		},
		filter: function (event, player) {
			return player.countCharge() && get.name(event.card) == "sha";
		},
		async content(event, trigger, player) {
			player.removeCharge();
			let num = player.maxHp - player.hp;
			var result2 = await player
				.chooseTarget("焚天：为【杀】增加一个额外目标。", function (card, player, target) {
					return !trigger.targets.includes(target) && player.canUse(trigger.card, target);
				})
				.forResult();
			if (result2.bool) trigger.targets.push(result2.targets[0]);
			if (num >= 1) trigger.baseDamage++;
			if (num >= 2) {
				if (!player.hasSkill("mrfentian_more")) await player.addTempSkill("mrfentian_more");
				else player.storage.mrfentian++;
			}
			if (num >= 3) {
				trigger.directHit.addArray(trigger.targets);
				await player.draw();
			}
		},
		ai: {
			directHit_ai: true,
			skillTagFilter(player, tag, arg) {
				if (!arg || !arg.card || !arg.target || arg.card.name != "sha" || !player.countCharge()) return false;
			},
		},
		mod: {
			targetInRange(card, player, target, now) {
				if (card.name == "sha") return true;
			},
			targetEnabled(card, player, target, now) {
				if (get.type(card) == "delay") return false;
			},
		},
		group: ["mrfentian_init", "mrfentian_die", "mrfentian_gain"],
		subSkill: {
			init: {
				trigger: {
					player: "enterGame",
					global: "phaseBefore",
				},
				filter(event, player) {
					if (!player.countCharge(true)) return false;
					return event.name != "phase" || game.phaseNumber == 0;
				},
				forced: true,
				locked: false,
				content() {
					player.addCharge(3);
				},
				sub: true,
				_priority: 0,
			},
			die: {
				forced: true,
				locked: false,
				trigger: {
					source: "dieAfter",
				},
				filter: function (event, player) {
					return player.countCharge();
				},
				async content(event, trigger, player) {
					await player.removeCharge();
					await player.gainMaxHp();
					await player.draw(2);
				},
			},
			gain: {
				forced: true,
				locked: false,
				usable: 2,
				trigger: {
					source: "damageEnd",
					player: "damageEnd",
				},
				filter: function (event, player) {
					return player.countCharge(true) && event.card && event.card.name == "sha";
				},
				async content(event, trigger, player) {
					player.addCharge();
				},
			},
			more: {
				init: function (player) {
					player.storage.mrfentian = 1;
				},
				onremove: function (player, skill) {
					player.storage.mrfentian = 1;
				},
				mod: {
					cardUsable(card, player, num) {
						if (card.name == "sha") return num + player.storage.mrfentian;
					},
				},
			},
		},
	},
	mrnuyan: {
		forced: true,
		mark: true,
		locked: true,
		zhuanhuanji: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				let str = player.storage.mrnuyan ? "当前处于鬼王姿态，你的下个回合开始时，结束鬼王姿态" : "当前不处于鬼王姿态，你的下个回合开始时，切换为鬼王姿态";
				return str;
			},
			markcount: function () {
				return 0;
			},
		},
		init: function (player, skill) {
			player.storage.mrnuyan = 0;
			player.storage.mrnuyan_dagame = 0;
		},
		trigger: {
			player: "phaseBegin",
		},
		async content(event, trigger, player) {
			if (!player.storage.mrnuyan) {
				await player.changeSkin({ characterName: "mr_guiwangjiutuntongzi" }, "mr_guiwangjiutuntongzi_guiwangzitai");
				await player.loseHp();
				await player.changeHujia();
				var current = game.expandSkills(player.getSkills());
				var lists = get.gainableSkills(function (info, skill, name) {
					if (current.includes(skill)) return false;
					//if (lib.characterSort.阴阳师.阴阳师_yys && lib.characterSort.阴阳师.阴阳师_yys.includes(name)) {
					var info1 = get.plainText(get.skillInfoTranslation(skill));
					return info1.includes("【杀】");
					//} else return false;
				}, player);
				var list = [];
				if (!lists.length) {
					player.chat("看来没有那种技能呢……");
					return;
				}
				for (var skill of lists) {
					let info = lib.skill[skill];
					if (!info) continue;
					if (typeof info.derivation == "string") lists.add(info.derivation);
					else if (Array.isArray(info.derivation)) {
						for (var skill2 of info.derivation) lists.add(skill2);
					}
				}
				if (lists.length > 3) {
					for (var i = 0; i < 3; i++) {
						var skill = await lists.randomGet();
						list.add(skill);
						lists.remove(skill);
					}
				} else list = lists;
				var dialog = ui.create.dialog("forcebutton");
				for (const skill of list) {
					var text = game.getSkillOwner(skill).map(c => get.translation(c));
					if (!text.length) {
						text = ["无"];
					}
					dialog.addText(`技能拥有者:${text}`);
					dialog.add([[[skill, '<div class="popup pointerdiv" style="width:80%;display:inline-block"><div class="skill">【' + get.translation(skill) + "】</div><div>" + lib.translate[skill + "_info"] + "</div></div>"]], "textbutton"]);
					dialog.addText("<br>");
				}
				var next = player.chooseButton(dialog, 1, true);
				next.set("ai", function (button) {
					return Math.random();
				});
				var result2 = await next.forResult();
				var skill = result2.links[0];
				await player.addTempSkill(skill, { player: "phaseBefore" });
				var text = await game.getSkillOwner(skill);
				if (!text.length) {
					text = ["不知道谁"];
				}
				game.log(player, "获得了", "#b" + get.translation(text[0]), "的技能", "#g【" + get.translation(result2.links) + "】");
			} else {
				await player.recover(Math.floor(player.storage.mrnuyan_dagame / 2));
				player.storage.mrnuyan_dagame = 0;
				await player.changeSkin({ characterName: "mr_guiwangjiutuntongzi" }, "mr_guiwangjiutuntongzi_initial");
			}
			await player.changeZhuanhuanji("mrnuyan");
		},
		group: ["mrnuyan_damage"],
		subSkill: {
			damage: {
				forced: true,
				locked: true,
				trigger: {
					source: "damageEnd",
				},
				silent: true,
				filter: function (event, player) {
					return player.storage.mrnuyan;
				},
				async content(event, trigger, player) {
					player.storage.mrnuyan_dagame += trigger.num;
				},
			},
		},
	},
	mrlunyi: {
		clanSkill: true,
		forced: true,
		locked: true,
		trigger: {
			player: "useCard",
		},
		filter: function (event, player) {
			if (game.countPlayer(p => p.hasClan("轮椅流")) == 0) return false;
			var evtx = event.getParent("phaseUse");
			if (!evtx || evtx.player != player) return false;
			return (
				player
					.getHistory("useCard", evt => {
						return evt.card.name == "sha" && event.getParent("phaseUse") == evtx;
					})
					.indexOf(event) == 0
			);
		},
		async content(event, trigger, player) {
			trigger.addCount = false;
			await player.getStat().card.sha--;
			player
				.when("useCardAfter")
				.filter(evt => evt == trigger)
				.then(() => {
					player
						.chooseTarget(true, "轮椅：令一名轮椅流角色摸一张牌", function (card, player, target) {
							return target.hasClan("轮椅流");
						})
						.set("ai", function (target) {
							return 1 + get.attitude(player, target);
						});
				})
				.then(() => {
					if (result.bool) result.targets[0].draw();
				});
		},
	},
	mr_shandianbishou: {
		forced: true,
		locked: true,
		equipSkill: true,
		trigger: {
			player: "useCard1",
		},
		filter(event, player) {
			return event.card.name == "sha";
		},
		async content(event, trigger, player) {
			let color = get.color(trigger.card),
				nature = get.nature(trigger.card);
			if (color == "red") await game.setNature(trigger.card, "fire");
			else if (color == "black") await game.setNature(trigger.card, "thunder");
			else trigger.baseDamage++;
			if (get.itemtype(trigger.card) == "card") {
				var next = game.createEvent("diandao_clear");
				next.card = trigger.card;
				event.next.remove(next);
				trigger.after.push(next);
				next.setContent(function () {
					game.setNature(trigger.card, nature);
				});
			}
		},
	},
	mrxinxian: {
		locked: true,
		group: "mrxinxian_shandianbishou",
		derivation: "mr_shandianbishou",
		subSkill: {
			shandianbishou: {
				forced: true,
				locked: true,
				inherit: "mr_shandianbishou",
				filter: function (event, player) {
					if (!player.hasEmptySlot(1)) return false;
					return lib.skill.mr_shandianbishou.filter(event, player);
				},
				mod: {
					attackRangeBase(player) {
						var num = lib.card?.guanshi?.distance?.attackFrom;
						if (typeof num != "number" || !player.hasEmptySlot(1)) return;
						return Math.max(player.getEquipRange(player.getCards("e")), 1 - num);
					},
				},
			},
		},
	},
	mryuegui: {
		forced: true,
		locked: true,
		trigger: {
			source: "damageEnd",
		},
		filter: function (event, player) {
			return event.hasNature();
		},
		async content(event, trigger, player) {
			player.addMark("mryuegui_tag", 2);
		},
		onremove: function (player, skill) {
			player.removeMark(player.countMark("mryuegui_tag"));
		},
		group: "mryuegui_sha",
		subSkill: {
			sha: {
				locked: true,
				forced: true,
				trigger: {
					player: "useCardAfter",
				},
				filter: function (event, player) {
					return event.card.name == "sha" && event.card.isCard;
				},
				async content(event, trigger, player) {
					player.addMark("mryuegui_tag", 1);
				},
			},
			tag: {
				marktext: "桂",
				intro: {
					name: "月桂之叶",
					content: "当前共有#层月桂之叶",
				},
			},
		},
	},
	mrxuanwu: {
		enable: "phaseUse",
		filter: function (event, player) {
			return player.countMark("mryuegui_tag") >= 4;
		},
		async content(event, trigger, player) {
			let num = player.countMark("mryuegui_tag"),
				nnum = Math.floor(num / 2);
			await player.removeMark("mryuegui_tag", num);
			while (nnum) {
				await player.chooseUseTarget(
					{
						name: "sha",
						isCard: true,
					},
					"璇舞：请选择【杀】的目标（" + nnum + "/" + Math.floor(num / 2) + "）",
					false,
					"nodistance"
				);
				nnum--;
			}
		},
		ai: {
			order() {
				return get.order({
					name: "sha",
					isCard: true,
				});
			},
			result: {
				player(player) {
					if (
						player.hasValueTarget({
							name: "sha",
							isCard: true,
						})
					)
						return 1;
					return 0;
				},
			},
			combo: "mryuegui",
		},
	},
	mrwuwei: {
		chargeSkill: 4,
		forced: true,
		locked: false,
		trigger: {
			source: "damageEnd",
		},
		filter: function (event, player) {
			return player.countCharge() && player.isDamaged();
		},
		async content(event, trigger, player) {
			await player.removeCharge();
			await player.recover();
		},
		group: ["mrwuwei_sha", "mrwuwei_jieshu", "mrwuwei_gain"],
		subSkill: {
			sha: {
				forced: true,
				locked: false,
				trigger: {
					player: "phaseUseEnd",
				},
				filter: function (event, player) {
					return player.countCharge();
				},
				async content(event, trigger, player) {
					await player.chooseUseTarget(
						{
							name: "sha",
							isCard: true,
						},
						"无畏：请选择【杀】的目标",
						false,
						"nodistance"
					);
				},
				ai: {
					result: {
						player(player) {
							if (
								player.hasValueTarget({
									name: "sha",
									isCard: true,
								})
							)
								return 1;
							return 0;
						},
					},
				},
			},
			jieshu: {
				forced: true,
				locked: false,
				trigger: {
					player: "phaseJieshu",
				},
				filter: function (event, player) {
					return player.countCharge();
				},
				async content(event, trigger, player) {
					let num = player.countCharge();
					await player.removeCharge(num);
					await player.changeHujia(num, "gain", 5);
				},
			},
			gain: {
				forced: true,
				locked: false,
				trigger: {
					global: "roundStart",
				},
				async content(event, trigger, player) {
					let num = game.countPlayer();
					await player.addCharge(num);
				},
			},
		},
	},
	mrmokai: {
		forced: true,
		locked: true,
		init: function (player) {
			player.storage.mrmokai = 0;
		},
		trigger: {
			player: "damageBegin",
		},
		content() {
			if (trigger.num) trigger.num--;
		},
		ai: {
			skillTagFilter(player, tag, target) {
				if (player.hasSkill("mrmokai") && tag == "filterDamage") return true;
			},
			filterDamage: true,
		},
		group: ["mrmokai_damage", "mrmokai_maxhp"],
		subSkill: {
			damage: {
				forced: true,
				locked: true,
				trigger: {
					player: "useCard2",
				},
				filter: function (event, player) {
					return (event.card.name == "sha" || (get.type(event.card) == "trick" && get.tag(event.card, "damage") > 0)) && event.targets.length == 1;
				},
				content() {
					trigger.baseDamage++;
				},
			},
			maxhp: {
				forced: true,
				locked: true,
				trigger: {
					player: "phaseBegin",
				},
				content() {
					player.storage.mrmokai++;
					if (player.storage.mrmokai <= 5) {
						player.gainMaxHp();
						player.recover();
					} else player.loseMaxHp();
					if (player.storage.mrmokai == 8) player.removeSkill("mrmokai");
				},
			},
		},
	},
	mrdilao: {
		chargeSkill: 3,
		trigger: {
			global: "useCardToTargeted",
		},
		init: function (player) {
			player.storage.mrdilao = 1;
		},
		filter(event, player) {
			if (player.storage.mrdilao) return event.card.name == "sha" && get.distance(event.target, player) == 1 && event.target.isIn() && player.countCharge(true);
			else return event.card.name == "sha" && get.distance(event.target, player) <= 1 && event.target.isIn() && event.player != player;
		},
		async content(event, trigger, player) {
			if (player.storage.mrdilao) {
				await trigger.target.changeHujia(1, "gain", 5);
				await player.changeHujia(1, "gain", 5);
				await player.addCharge();
			} else {
				let card = { name: "sha", isCard: true };
				if (player.canUse(card, trigger.player, false, false)) {
					player.useCard(card, false, trigger.player);
					trigger.player
						.when("damageEnd")
						.filter(evt => evt.getParent(3).name == "mrdilao")
						.then(() => {
							trigger.source.addCharge();
						});
				}
			}
		},
		derivation: ["mrzhenshen", "mrdilao_rewrite"],
		group: ["mrdilao_bianshen"],
		subSkill: {
			bianshen: {
				skillAnimation: true,
				animationColor: "thunder",
				forced: true,
				locked: false,
				trigger: {
					player: "phaseBegin",
				},
				filter: function (event, player) {
					return !player.countCharge(true);
				},
				async content(event, trigger, player) {
					await player.removeCharge(player.countCharge());
					await player.addTempSkill("mrzhenshen", { player: "phaseBefore" });
					player.storage.mrdilao = 0;
				},
			},
		},
	},
	mrzhenshen: {
		forced: true,
		locked: true,
		init: function (player) {
			player.gainMaxHp(2);
			player.recover(2);
		},
		onremove: function (player, skill) {
			player.loseMaxHp(2);
			player.draw(2);
			player.storage.mrdilao = 1;
		},
		trigger: {
			player: "useCard",
		},
		filter: function (event, player) {
			return event.card.name == "sha";
		},
		content() {
			trigger.directHit.addArray(
				game.filterPlayer(function (current) {
					return current != player;
				})
			);
		},
		ai: {
			directHit_ai: true,
		},
		mod: {
			targetInRange(card, player, target, now) {
				if (card.name == "sha") return true;
			},
		},
	},
	mryueying: {
		forced: true,
		locked: true,
		trigger: {
			player: "changeHp",
		},
		filter: function (event, player) {
			return event.num < 0;
		},
		async content(event, trigger, player) {
			await player.changeHujia(-trigger.num, "gain", 5);
		},
	},
	mryuexuan: {
		usable: 1,
		trigger: {
			source: "damageEnd",
		},
		filter: function (event, player) {
			return event.player.isIn();
		},
		check: function (event, player) {
			return 1 - get.attitude(player, event.player);
		},
		async content(event, trigger, player) {
			await trigger.player.loseHp();
			await player.changeHujia(1, "gain", 5);
		},
	},
	mryuemang: {
		trigger: {
			player: "dyingBegin",
		},
		filter: function (event, player) {
			return player.hujia;
		},
		async content(event, trigger, player) {
			await player.changeHujia(-player.hujia);
			let ccard = { name: "sha", isCard: true, storage: { mryuemang: true } };
			const result = await player
				.chooseTarget("月芒：请选择【杀】的目标", false, function (card, player, target) {
					return player.canUse(ccard, target, false, false);
				})
				.set("ai", function (target) {
					return 1 - get.attitude(player, target);
				})
				.forResult();
			if (!result.bool) return;
			await player.useCard(ccard, "mryuemang", result.targets[0]);
		},
		group: "mryuemang_recover",
		subSkill: {
			recover: {
				locked: false,
				forced: true,
				popup: false,
				trigger: {
					source: "damageSource",
				},
				filter: function (event, player) {
					return event.card && event.card.storage && event.card.storage.mryuemang && event.getParent().type == "card";
				},
				async content(event, trigger, player) {
					player.recover();
				},
			},
		},
		ai: {
			result: {
				player(player) {
					if (
						player.hasValueTarget({
							name: "sha",
							isCard: true,
						})
					)
						return 1;
					return 0;
				},
			},
		},
	},
	mrshunhua: {
		chargeSkill: 3,
		forced: true,
		locked: false,
		trigger: {
			source: "damageBegin",
		},
		init: function (player) {
			player.storage.mrshunhua = 1;
		},
		filter: function (event, player) {
			return player.countCharge() && event.getParent().name != "mrshunhua";
		},
		async content(event, trigger, player) {
			await player.removeCharge();
			let target = trigger.player;
			if (target.hasMark("mrshunhua_tag")) {
				const list = [];
				list.push("选项一");
				list.push("选项二");
				list.push("cancel2");
				const result = await player
					.chooseControl(list)
					.set("choiceList", ["对其造成1点伤害", "获得1点护甲"])
					.set("prompt", get.prompt("mrshunhua"))
					.set("ai", () => {
						let bool1 = Math.random() - 0.5;
						if (bool1 > 0) return "选项一";
						else return "选项二";
					})
					.forResult();
				if (result.control == "选项一") await target.damage(player);
				else if (result.control == "选项二") await player.changeHujia(1, "gain", 5);
			} else {
				await target.addMark("mrshunhua_tag");
				await player.draw();
			}
		},
		onremove: function (player, skill) {
			game.countPlayer(p => {
				if (p.hasMark("mrshunhua_tag")) p.removeSkill("mrshunhua_tag");
			});
		},
		group: ["mrshunhua_gain", "mrshunhua_gain2"],
		subSkill: {
			tag: {
				marktext: "月",
				intro: {
					content: "你已被挂上“月”标记！",
					markcount() {
						return 0;
					},
				},
			},
			gain: {
				forced: true,
				locked: false,
				trigger: {
					player: "phaseBegin",
				},
				filter: function (event, player) {
					return !player.countCharge() && player.storage.mrshunhua;
				},
				async content(event, trigger, player) {
					await player.addCharge(4);
					game.countPlayer(p => {
						if (p.hasMark("mrshunhua_tag")) p.removeSkill("mrshunhua_tag");
					});
				},
			},
			gain2: {
				forced: true,
				locked: false,
				trigger: {
					player: "mrshunhuaAfter",
				},
				filter: function (event, player) {
					return !player.countCharge() && !player.storage.mrshunhua;
				},
				async content(event, trigger, player) {
					await player.addCharge(3);
				},
			},
		},
	},
	mrhuanhai: {
		enable: "phaseUse",
		limited: true,
		skillAnimation: true,
		animationColor: "thunder",
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => (player.storage[skill] = false),
		filterTarget(card, player, target) {
			return target != player;
		},
		async content(event, trigger, player) {
			player.awakenSkill(event.name);
			if (player.countCharge(true)) await player.addCharge(player.countCharge(true));
			player.storage.mrshunhua = 0;
			player.storage.mrhuanhai = event.target;
			var evt = _status.event;
			for (var i = 0; i < 10; i++) {
				if (evt && evt.getParent) {
					evt = evt.getParent();
				}
				if (evt.name == "phaseUse") {
					evt.skipped = true;
					break;
				}
			}
			await player.addSkill("mrhuanhai_duijue");
		},
		duijueLoop() {
			"step 0";
			targets[0].phase("mrhuanhai");
			("step 1");
			ui.duijueLoop.round--;
			ui.duijueLoop.innerHTML = get.cnNumber(ui.duijueLoop.round) + "回合";
			if (targets[0].isDead() || targets[1].isDead() || ui.duijueLoop.round == 0) {
				event.goto(3);
			} else {
				targets[1].phase("mrhuanhai");
			}
			("step 2");
			ui.duijueLoop.round--;
			ui.duijueLoop.innerHTML = get.cnNumber(ui.duijueLoop.round) + "回合";
			if (targets[0].isDead() || targets[1].isDead() || ui.duijueLoop.round == 0) {
				event.goto(3);
			} else {
				event.goto(0);
			}
			("step 3");
			for (var i = 0; i < event.backup.length; i++) {
				event.backup[i].in("mrhuanhai");
			}
			if (ui.duijueLoop) {
				ui.duijueLoop.remove();
				delete ui.duijueLoop;
			}
			player.storage.mrshunhua = 1;
		},
		subSkill: {
			duijue: {
				trigger: {
					player: "phaseAfter",
				},
				forced: true,
				popup: false,
				priority: -50,
				content() {
					var target = player.storage.mrhuanhai;
					delete player.storage.mrhuanhai;
					player.removeSkill("mrhuanhai_duijue");
					if (!target.isAlive()) {
						event.finish();
						return;
					}
					var next = player.insertEvent("duijueLoop", lib.skill.mrhuanhai.duijueLoop, {
						targets: [player, target],
						num: 0,
						backup: [],
						source: player,
					});
					next.forceDie = true;
					for (var i = 0; i < game.players.length; i++) {
						if (game.players[i] != player && game.players[i] != target) {
							game.players[i].out("mrhuanhai");
							next.backup.push(game.players[i]);
						}
					}
					if (!ui.duijueLoop) {
						ui.duijueLoop = ui.create.system("六回合", null, true);
						lib.setPopped(
							ui.duijueLoop,
							function () {
								var uiintro = ui.create.dialog("hidden");
								uiintro.add("幻海映月");
								uiintro.addText(get.cnNumber(ui.duijueLoop.round) + "回合后结束");
								uiintro.add(ui.create.div(".placeholder.slim"));
								return uiintro;
							},
							180
						);
						ui.duijueLoop.round = 6;
					}
				},
			},
		},
		ai: {
			order: 13,
			result: {
				target: (player, target) => {
					let hs = player.countCards("h", card => {
							if (!get.tag(card, "damage") || get.effect(target, card, player, player) <= 0) return 0;
							if (get.name(card, player) === "sha") {
								if (target.getEquip("bagua")) return 0.5;
								if (target.getEquip("rewrite_bagua")) return 0.25;
							}
							return 1;
						}),
						ts =
							target.hp +
							target.hujia +
							game.countPlayer(current => {
								if (get.attitude(current, target) > 0) return current.countCards("hs") / 8;
								return 0;
							});
					if (hs >= ts) return -hs;
					return 0;
				},
			},
		},
	},
	mrkuilei: {
		enable: "phaseUse",
		usable: 1,
		skillAnimation: true,
		animationColor: "thunder",
		check: function (event, player) {
			return true;
		},
		filter: function (event, player) {
			return player.storage.mrkuilei_init == null && player.countMark("mrkuilei_tag") >= 4;
		},
		filterTarget(card, player, target) {
			return target != player;
		},
		init: function (player) {
			player.storage.mrkuilei_init = null;
			player.storage.mrkuilei_hp = null;
			player.storage.mrkuilei_maxhp = null;
			player.storage.mrkuilei_target = null;
		},
		async content(event, trigger, player) {
			await player.removeMark("mrkuilei_tag", 4);
			let target = event.target,
				bool = player.identity == "zhu" ? 1 : 0;
			player.storage.mrkuilei_init = player.name1;
			player.storage.mrkuilei_hp = player.hp;
			player.storage.mrkuilei_maxhp = player.maxHp;
			player.storage.mrkuilei_target = target.name;
			if (get.character(player.name2, 3).includes("mrshishen")) player.storage.mrkuilei_init = player.name2;
			await player.reinit(player.storage.mrkuilei_init, target.name, target.maxHp - bool);
			player.hp = player.maxHp;
			await player.addSkill(["mrkuilei_huanyuan", "mrkuilei_damage", "mrkuilei_huanyuan2"]);
			await player.update();
		},
		ai: {
			order: 8,
			result: {
				player: function (player) {
					return 1;
				},
			},
		},
		group: "mrkuilei_gain",
		subSkill: {
			tag: {
				marktext: "碎",
				intro: {
					name: "英雄碎片",
					content: "当前共有#个英雄碎片",
				},
			},
			huanyuan: {
				forced: true,
				locked: false,
				trigger: {
					player: "dying",
				},
				filter: function (event, player) {
					return player.storage.mrkuilei_init != null;
				},
				async content(event, trigger, player) {
					let hp = player.storage.mrkuilei_hp;
					await player.reinit(player.storage.mrkuilei_target, player.storage.mrkuilei_init, player.storage.mrkuilei_maxhp);
					await player.removeSkill(["mrkuilei_huanyuan", "mrkuilei_damage", "mrkuilei_huanyuan2"]);
					player.hp = hp;
					await player.update();
					await player.turnOver();
				},
			},
			huanyuan2: {
				enable: "phaseUse",
				usable: 1,
				filter: function (event, player) {
					return player.storage.mrkuilei_init != null;
				},
				async content(event, trigger, player) {
					let hp = player.storage.mrkuilei_hp;
					await player.reinit(player.storage.mrkuilei_target, player.storage.mrkuilei_init, player.storage.mrkuilei_maxhp);
					await player.removeSkill(["mrkuilei_huanyuan", "mrkuilei_damage", "mrkuilei_huanyuan2"]);
					player.hp = hp;
					await player.update();
				},
			},
			damage: {
				forced: true,
				locked: false,
				silent: true,
				trigger: {
					player: "damageBefore",
				},
				async content(event, trigger, player) {
					trigger.num++;
				},
			},
			gain: {
				forced: true,
				locked: false,
				trigger: {
					player: "useCard",
				},
				filter: function (event, player) {
					return event.targets && event.targets.some(p => p != player);
				},
				async content(event, trigger, player) {
					player.addMark("mrkuilei_tag");
				},
			},
		},
	},
	mrshizhan: {
		enable: "phaseUse",
		usable: 1,
		check: function (event, player) {
			return true;
		},
		filter(event, player) {
			let bool = 0;
			game.countPlayer(p => {
				if (player.canUse({ name: "wanjian" }, p, false) || player.canUse({ name: "nanman" }, p, false)) bool = 1;
			});
			return bool;
		},
		filterTarget: function (card, player, target) {
			return player.canUse({ name: "wanjian" }, target, false) || player.canUse({ name: "nanman" }, target, false);
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			player.storage.mrshizhan_bool = 0;
			let card1 = { name: "nanman", isCard: true },
				card2 = { name: "wanjian", isCard: true },
				target = event.target;
			await player.useCard(card1, target, false);
			await game.delay();
			await player.useCard(card2, target, false);
		},
		group: "mrshizhan_damage",
		subSkill: {
			damage: {
				forced: true,
				locked: false,
				trigger: {
					global: "damageEnd",
				},
				filter: function (event, player) {
					return event.getParent(3).name == "mrshizhan";
				},
				async content(event, trigger, player) {
					game.delay();
					if (trigger.card.name == "nanman") {
						player.storage.mrshizhan_bool = 1;
						player.addMark("mrkuilei_tag");
					} else {
						player.addMark("mrkuilei_tag");
						if (player.storage.mrshizhan_bool) await trigger.player.damage(trigger.player.maxHp - trigger.player.hp, player);
					}
				},
			},
		},
		ai: {
			order: 8,
			threaten: 2,
			expose: 0.5,
			result: {
				target: function (player, target) {
					let eff = 0;
					eff -= get.effect(target, { name: "nanman" }, player, player);
					eff -= get.effect(target, { name: "wanjian" }, player, player);
					eff -= 2 * (target.maxHp - target.hp);
					return eff;
				},
			},
		},
	},
	mrfawu: {
		enable: "phaseUse",
		init: function (player) {
			player.storage.mrfawu_enable = 1;
		},
		viewAsFilter(player) {
			return player.storage.mrfawu_enable == 1 && player.countCards("hs") > 0;
		},
		viewAs: {
			name: "chuqibuyi",
		},
		filterCard: true,
		position: "hs",
		check: function (card) {
			return 7 - get.value(card);
		},
		group: ["mrfawu_effect", "mrfawu_gain"],
		subSkill: {
			effect: {
				forced: true,
				locked: false,
				trigger: {
					player: "useCardAfter",
				},
				filter: function (event, player) {
					return event.card && event.card.name == "chuqibuyi";
				},
				async content(event, trigger, player) {
					if (player.hasHistory("sourceDamage", evt => evt.getParent(2) == trigger)) {
						await player.draw();
						let targets = trigger.targets;
						for (var p of targets) await player.gainPlayerCard("he", p, true);
					} else {
						player.storage.mrfawu_enable = 0;
						player
							.when("phaseEnd")
							.filter(() => {
								return player.storage.mrfawu_enable == 0;
							})
							.then(() => {
								player.storage.mrfawu_enable = 1;
							});
					}
				},
			},
			gain: {
				forced: true,
				locked: false,
				trigger: {
					source: "damageAfter",
				},
				filter: function (event, player) {
					let damage = {};
					player.hasHistory("sourceDamage", evt => {
						let p = evt.player.name;
						if (p in damage) damage[p]++;
						else damage[p] = 1;
					});
					for (var p in damage) if (damage[p] == 3) return true;
				},
				async content(event, trigger, player) {
					let card = await get.cardPile("chuqibuyi");
					if (card) await player.gain(card, "gain2", "log");
				},
			},
		},
	},
	mrjishu: {
		enable: ["chooseToUse", "chooseToRespond"],
		filter: function (event, player) {
			if (player.hasSkill("mrjishu_disable")) return false;
			for (var i of lib.inpile) {
				var type = get.type2(i);
				if ((type == "basic" || type == "trick") && event.filterCard({ name: i }, player, event)) {
					player.storage.evt = event;
					return true;
				}
			}
			return false;
		},
		async content(event, trigger, player) {
			var cards = get.cards(3);
			await player.showCards(cards, "技术");

			var types = [];
			var sameTypeCount = {};
			let str = "",
				evt = player.storage.evt;
			for (var i = 0; i < cards.length; i++) {
				var type = get.type(cards[i]);
				types.push(type);
				if (!sameTypeCount[type]) sameTypeCount[type] = 0;
				sameTypeCount[type]++;
			}

			var maxSame = 0;
			for (var type in sameTypeCount) {
				if (sameTypeCount[type] > maxSame) maxSame = sameTypeCount[type];
			}

			var allSame = maxSame == 3;
			var allDifferent = Object.keys(sameTypeCount).length == 3;
			var exactlyTwoSame = maxSame == 2 && Object.keys(sameTypeCount).length == 2;

			if (allDifferent) {
				player.storage.mrjishu_option3_thisround = true;
				await player.chooseToDiscard("h", true, "弃置一张手牌");
				await player.addTempSkill("mrjishu_disable", "phaseBegin");
				await game.cardsDiscard(cards);
				await ui.create.dialog("技术", "三张牌类别均不同，弃置手牌，技能失效");
				let eevt = evt.getParent();
				if (eevt.name == "_wuxie") eevt = eevt.getParent();
				eevt.redo();
				return;
			} else if (allSame) {
				var suits = [];
				var cardTypes = [];
				var numbers = [];
				for (var i = 0; i < cards.length; i++) {
					suits.push(get.suit(cards[i]));
					cardTypes.push(get.type(cards[i]));
					numbers.push(get.number(cards[i]));
				}

				var gainCards = [];

				var deckCards = ui.cardPile.childNodes;
				var validCards = [];
				for (var i = 0; i < deckCards.length; i++) {
					var card = deckCards[i];
					var suit = get.suit(card);
					var type = get.type(card);
					var number = get.number(card);

					if (!suits.contains(suit) && !cardTypes.contains(type) && !numbers.contains(number)) {
						validCards.push(card);
					}
				}

				for (var j = 0; j < 3 && validCards.length > 0; j++) {
					var selectedCard = validCards.randomGet();
					gainCards.push(selectedCard);
					validCards.remove(selectedCard);

					suits.push(get.suit(selectedCard));
					cardTypes.push(get.type(selectedCard));
					numbers.push(get.number(selectedCard));
				}

				if (gainCards.length > 0) {
					await player.gain(gainCards, "gain2");
				}

				str = "三张牌类别相同，从牌堆获得" + gainCards.length + "张牌，请选择要使用的类别相同的两张牌";
			} else if (exactlyTwoSame) {
				str = "两张牌类别相同，请选择要使用的类别相同的两张牌";
			}
			var list = [];
			for (var i = 0; i < lib.inpile.length; i++) {
				var name = lib.inpile[i];
				if (name == "sha") {
					if (evt.filterCard({ name: name }, player, evt)) list.push(["基本", "", "sha"]);
					for (var j of lib.inpile_nature) {
						if (evt.filterCard({ name: name, nature: j }, player, evt)) list.push(["基本", "", "sha", j]);
					}
				} else if (get.type2(name) == "trick" && evt.filterCard({ name: name }, player, evt)) list.push(["锦囊", "", name]);
				else if (get.type(name) == "basic" && evt.filterCard({ name: name }, player, evt)) list.push(["基本", "", name]);
			}
			if (list.length == 0) {
				await game.cardsDiscard(cards);
				await ui.create.dialog("技术：已无可用牌");
				return;
			}
			let dialog = await ui.create.dialog("技术", str, [cards, "vcard"], "当作任意一张基本牌或锦囊牌使用或打出", [list, "vcard"]);
			var next = player.chooseButton(dialog, 3);
			next.set("filterButton", function (button) {
				if (list.includes(button.link)) {
					if (ui.selected.buttons.some(c => list.includes(c.link))) return false;
					return evt.filterCard({ name: button.link[2] }, player, evt);
				} else if (cards.includes(button.link)) {
					if ((ui.selected.buttons.length && ui.selected.buttons.filter(c => cards.includes(c.link)).length == 2) || ui.selected.buttons.some(c => cards.includes(c.link) && get.type(c.link) != get.type(button.link))) {
						return false;
					}
				}
				return true;
			});
			const result = await next.forResult();
			if (result.bool) {
				let cards1 = result.links.filter(c => cards.includes(c));
				let card = result.links.find(c => list.includes(c));
				if (["wuxie", "shan"].includes(card[2]) || evt.name == "chooseToRespond") {
					evt.result.bool = true;
					evt.result.card = get.autoViewAs({ name: card[2], isCard: true }, cards1);
					evt.result.cards = cards1;
					if (card[2] == "wuxie") evt = evt.getParent();
					evt.redo();
				} else
					player
						.chooseUseTarget(true)
						.set("card", get.autoViewAs({ name: card[2], nature: card[3], isCard: true }, cards1))
						.set("cards", cards1);
			} else {
				let eevt = evt.getParent();
				if (eevt.name == "_wuxie") eevt = eevt.getParent();
				eevt.redo();
			}
			await player.addTempSkill("mrjishu_disable", "phaseBegin");
			if (player.countMark("mrzhijian_tag") < 99) player.addMark("mrzhijian_tag", Math.min(10, 99 - player.countMark("mrzhijian_tag")));
		},
		hiddenCard: function (player, name) {
			if (!lib.inpile.contains(name)) return false;
			var type = get.type2(name);
			return (type == "basic" || type == "trick") && !player.hasSkill("mrjishu_disable");
		},
		subSkill: {
			disable: {
				forced: true,
				locked: true,
				silent: true,
				trigger: {
					player: "phaseBefore",
				},
				content() {
					player.removeSkill("mrjishu_disable");
				},
				mark: true,
				marktext: "封",
				intro: {
					content: "【技术】失效直到下一个回合开始",
				},
				sub: true,
			},
		},
		ai: {
			fireAttack: true,
			respondSha: true,
			respondShan: true,
			skillTagFilter(player) {
				if (player.hasSkill("mrjishu_disable")) return false;
			},
			order: 1,
			result: {
				player(player) {
					if (_status.event.dying) {
						return get.attitude(player, _status.event.dying);
					}
					return 1;
				},
			},
		},
	},
	mrtianlei: {
		enable: "phaseUse",
		usable: 1,
		skillAnimation: true,
		animationStr: "天雷万象",
		animationColor: "thunder",
		init: function (player) {
			player.storage.mrtianlei_damage = 0;
			player.storage.mrtianlei_damageMax = 2;
		},
		filter: function (event, player) {
			return (
				player.countCards("h") >= 3 &&
				game.countPlayer(p => {
					return player.canUse({ name: "sha" }, p, false) && !p.hasSkill("mrleizhong"); //这里改判断条件
				})
			);
		},
		check(card) {
			return 8 - get.value(card);
		},
		filterCard: true,
		selectCard: 3,
		position: "he",
		complexCard: true,
		filterTarget: function (card, player, target) {
			return player.canUse({ name: "sha" }, target, false) && !target.hasSkill("mrleizhong"); //这里改判断条件
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			let card = {
				name: "sha",
				nature: "thunder",
				isCard: true,
			};
			let nnum = 3,
				target = event.target;
			if (!player.hujia) player.storage.mrtianlei_damageMax += 2;
			if (target.maxHp > player.maxHp) player.storage.mrtianlei_damageMax += 2;
			while (nnum--) {
				if (target.isAlive() && !target.hasSkill("mrleizhong")) await player.useCard(card, target, false);
			}
		},
		group: ["mrtianlei_use", "mrtianlei_damage", "mrtianlei_clear"],
		subSkill: {
			use: {
				forced: true,
				locked: true,
				silent: true,
				trigger: {
					player: "useCard2",
				},
				filter: function (event, player) {
					return event.getParent().name == "mrtianlei" && !player.hujia;
				},
				async content(event, trigger, player) {
					trigger.baseDamage += 1;
				},
			},
			damage: {
				forced: true,
				locked: true,
				silent: true,
				trigger: {
					source: "damageBegin1",
				},
				filter: function (event, player) {
					return event.getParent(3).name == "mrtianlei";
				},
				async content(event, trigger, player) {
					let num = Math.min(trigger.num, player.storage.mrtianlei_damageMax - player.storage.mrtianlei_damage);
					player.storage.mrtianlei_damage += num;
					trigger.num = num;
				},
			},
			clear: {
				forced: true,
				locked: true,
				silent: true,
				trigger: {
					player: "mrtianleiAfter",
				},
				async content(event, trigger, player) {
					player.storage.mrtianlei_damage = 0;
					player.storage.mrtianlei_damageMax = 2;
				},
			},
		},
		ai: {
			order: 8,
			result: {
				target: function (player, target) {
					return 3 * get.effect(target, { name: "sha", isCard: true, nature: "thunder" }, player, player);
				},
			},
			tag: {
				thunderDamage: function (card, nature) {
					let num = 2;
					if (!player.hujia) num += 2;
					return num;
				},
			},
		},
	},
	mrjijie: {
		forced: true,
		unique: true,
		trigger: {
			player: "enterGame",
			global: "phaseBefore",
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		derivation: ["hgjianyu", "hglangqing", "hgjinggu", "hgchuixuan", "hgxiedu", "hgyuanmou", "hglongjuan", "hgyingchu", "hghuangquan", "hglingxun"],
		shishen: [
			["haiguo_dayuewan", "hgjianyu"],
			["haiguo_lingluyuqian", "hglangqing"],
			["haiguo_jiuciliang", "hgjinggu"],
			["haiguo_xieji", "hgchuixuan"],
			["haiguo_xienv", "hgxiedu"],
			["haiguo_haiming", "hgyuanmou"],
			["haiguo_fengli", "hglongjuan"],
			["haiguo_hairen", "hgyingchu"],
			["haiguo_yecha", "hghuangquan"],
			["haiguo_linghaidie", "hglingxun"],
		],
		conflictMap(player) {
			if (!_status.shishenMap) {
				_status.shishenMap = {
					haiguo_dayuewan: [],
					haiguo_lingluyuqian: [],
					haiguo_jiuciliang: ["haiguo_hairen"],
					haiguo_xieji: [],
					haiguo_xienv: [],
					haiguo_haiming: [],
					haiguo_fengli: [],
					haiguo_hairen: ["haiguo_jiuciliang"],
					haiguo_yecha: [],
					haiguo_linghaidie: [],
				};
				if (!get.isLuckyStar(player)) {
					var list = lib.skill.mrjijie.shishen.map(i => i[0]);
					for (var i of list) {
						var select = list.filter(ss => ss != i && !_status.shishenMap[i].includes(i));
						_status.shishenMap[i].addArray(select.randomGets(get.rand(0, select.length)));
					}
				}
			}
			return _status.shishenMap;
		},
		onremove(player) {
			delete player.storage.mrjijie;
			delete player.storage.mrjijie_current;
			if (lib.skill.mrjijie.isSingleHaiguoshishen(player)) {
				game.broadcastAll(function (player) {
					player.name1 = player.name;
					player.skin.name = player.name;
					player.smoothAvatar(false);
					player.node.avatar.setBackground(player.name, "character");
					player.node.name.innerHTML = get.slimName(player.name);
					delete player.name2;
					delete player.skin.name2;
					player.classList.remove("fullskin2");
					player.node.avatar2.classList.add("hidden");
					player.node.name2.innerHTML = "";
					if (player == game.me && ui.fakeme) {
						ui.fakeme.style.backgroundImage = player.node.avatar.style.backgroundImage;
					}
				}, player);
			}
		},
		content() {
			"step 0";
			var list = lib.skill.mrjijie.shishen.map(i => i[0]);
			player.markAuto("mrjijie", list);
			game.broadcastAll(
				function (player, list) {
					var cards = [];
					for (var i = 0; i < list.length; i++) {
						var cardname = "huashen_card_" + list[i];
						lib.card[cardname] = {
							fullimage: true,
							image: "ext:阴阳师/character/mr_haiguo/" + list[i] + ".jpg",
						};
						lib.translate[cardname] = get.rawName2(list[i]);
						cards.push(game.createCard(cardname, "", ""));
					}
					player.$draw(cards, "nobroadcast");
				},
				player,
				list
			);
			("step 1");
			var next = game.createEvent("mrjijie_clique");
			next.player = player;
			next.setContent(lib.skill.mrjijie.contentx);
		},
		contentx() {
			"step 0";
			var list = player.getStorage("mrjijie").slice();
			var first = list.randomRemove();
			event.first = first;
			var others = list.randomGets(4);
			if (others.length == 1) {
				event._result = { bool: true, links: others };
			} else {
				var map = {
						haiguo_jiuciliang: "haiguo_hairen",
						haiguo_hairen: "haiguo_jiuciliang",
					},
					map2 = lib.skill.mrjijie.conflictMap(player);
				var conflictList = others.filter(ss => {
						if (map[first] && others.some(ss2 => map[first] == ss2)) {
							return map[first] == ss;
						} else {
							return map2[first].includes(ss);
						}
					}),
					list = others.slice();
				if (conflictList.length) {
					var conflict = conflictList.randomGet();
					list.remove(conflict);
					game.broadcastAll(
						function (ss, player) {
							if (lib.config.background_speak) {
								if (player.isUnderControl(true)) {
									game.playAudio("skill", ss + "_enter");
								}
							}
						},
						conflict,
						player
					);
				}
				player
					.chooseButton(["集结：请选择召集式神", [[first], "character"], '<div class="text center">可选式神</div>', [others, "character"]], true)
					.set("filterButton", button => {
						return _status.event.canChoose.includes(button.link);
					})
					.set("canChoose", list)
					.set("ai", button => Math.random() * 10);
			}
			("step 1");
			if (result.bool) {
				var first = event.first;
				var chosen = result.links[0];
				var skills = [];
				var list = lib.skill.mrjijie.shishen;
				var shishens = [first, chosen];
				player.unmarkAuto("mrjijie", shishens);
				player.storage.mrjijie_current = shishens;
				for (var ss of shishens) {
					for (var cs of list) {
						if (ss == cs[0]) {
							skills.push(cs[1]);
						}
					}
				}
				if (lib.skill.mrjijie.isSingleHaiguoshishen(player)) {
					game.broadcastAll(
						function (player, first, chosen) {
							player.name1 = first;
							player.node.avatar.setBackground(first, "character");
							player.node.name.innerHTML = get.slimName(first);
							player.name2 = chosen;
							player.skin.name = first;
							player.skin.name2 = chosen;
							player.classList.add("fullskin2");
							player.node.avatar2.classList.remove("hidden");
							player.node.avatar2.setBackground(chosen, "character");
							player.node.name2.innerHTML = get.slimName(chosen);
							if (player == game.me && ui.fakeme) {
								ui.fakeme.style.backgroundImage = player.node.avatar.style.backgroundImage;
							}
						},
						player,
						first,
						chosen
					);
				}
				game.log(player, "选择了常侍", "#y" + get.translation(shishens));
				if (skills.length) {
					player.addAdditionalSkill("mrjijie", skills);
					var str = "";
					for (var i of skills) {
						str += "【" + get.translation(i) + "】、";
						player.popup(i);
					}
					str = str.slice(0, -1);
					game.log(player, "获得了技能", "#g" + str);
				}
			}
		},
		isSingleHaiguoshishen(player) {
			var map = lib.skill.mrjijie.conflictMap(player);
			return player.name == "mr_linglushanzhihun" && ((map[player.name1] && map[player.name2]) || (map[player.name1] && !player.name2) || (!player.name1 && !player.name2) || (player.name == player.name1 && !player.name2));
		},
		mod: {
			aiValue(player, card, num) {
				if (["shan", "tao", "wuxie", "caochuan"].includes(card.name)) {
					return num / 10;
				}
			},
			aiUseful() {
				return lib.skill.mrjijie.mod.aiValue.apply(this, arguments);
			},
		},
		ai: {
			combo: "mrjuezhan",
			nokeep: true,
		},
		intro: {
			mark(dialog, storage, player) {
				dialog.addText("剩余式神");
				dialog.addSmall([storage, "character"]);
				if (player.storage.mrjijie_current && player.isIn()) {
					dialog.addText("当前式神");
					dialog.addSmall([player.storage.mrjijie_current, "character"]);
				}
			},
		},
	},
	mrjuezhan: {
		trigger: {
			player: "dieBefore",
		},
		filter(event, player) {
			return event.getParent().name != "giveup" && player.maxHp > 0;
		},
		forced: true,
		direct: true,
		priority: 15,
		group: ["mrjuezhan_die", "mrjuezhan_return"],
		content() {
			if (_status.mrjuezhan_return && _status.mrjuezhan_return[player.playerid]) {
				trigger.cancel();
			} else {
				if (player.getStorage("mrjijie").length) {
					player.logSkill("mrjuezhan");
					game.broadcastAll(function () {
						if (lib.config.background_speak) {
							game.playAudio("die", "shishenRest");
						}
					});
					trigger.setContent(lib.skill.mrjuezhan.dieContent);
					trigger.includeOut = true;
				} else {
					//player.changeSkin("mrjuezhan", "mr_haiguo_dead");
				}
			}
		},
		ai: {
			combo: "mrjijie",
			neg: true,
		},
		dieContent() {
			"step 0";
			event.forceDie = true;
			if (source) {
				game.log(player, "被", source, "杀害");
				if (source.stat[source.stat.length - 1].kill == undefined) {
					source.stat[source.stat.length - 1].kill = 1;
				} else {
					source.stat[source.stat.length - 1].kill++;
				}
			} else {
				game.log(player, "阵亡");
			}
			if (player.isIn() && (!_status.mrjuezhan_return || !_status.mrjuezhan_return[player.playerid])) {
				event.reserveOut = true;
				game.log(player, "进入了修整状态");
				game.log(player, "移出了游戏");
				//game.addGlobalSkill('mbmowang_return');
				if (!_status.mrjuezhan_return) {
					_status.mrjuezhan_return = {};
				}
				_status.mrjuezhan_return[player.playerid] = 1;
			} else {
				event.finish();
			}
			if (!game.countPlayer()) {
				game.over();
			} else if (player.hp != 0) {
				player.changeHp(0 - player.hp, false).forceDie = true;
			}
			game.broadcastAll(function (player) {
				if (player.isLinked()) {
					if (get.is.linked2(player)) {
						player.classList.toggle("linked2");
					} else {
						player.classList.toggle("linked");
					}
				}
				if (player.isTurnedOver()) {
					player.classList.toggle("turnedover");
				}
			}, player);
			game.addVideo("link", player, player.isLinked());
			game.addVideo("turnOver", player, player.classList.contains("turnedover"));
			("step 1");
			event.trigger("die");
			("step 2");
			if (event.reserveOut) {
				if (!game.reserveDead) {
					for (var mark in player.marks) {
						if (mark == "mrjijie") {
							continue;
						}
						player.unmarkSkill(mark);
					}
					var count = 1;
					var list = Array.from(player.node.marks.childNodes);
					if (list.some(i => i.name == "mrjijie")) {
						count++;
					}
					while (player.node.marks.childNodes.length > count) {
						var node = player.node.marks.lastChild;
						if (node.name == "mrjijie") {
							node = node.previousSibling;
						}
						node.remove();
					}
					game.broadcast(
						function (player, count) {
							while (player.node.marks.childNodes.length > count) {
								var node = player.node.marks.lastChild;
								if (node.name == "mrjijie") {
									node = node.previousSibling;
								}
								node.remove();
							}
						},
						player,
						count
					);
				}
				for (var i in player.tempSkills) {
					player.removeSkill(i);
				}
				var skills = player.getSkills();
				for (var i = 0; i < skills.length; i++) {
					if (lib.skill[skills[i]].temp) {
						player.removeSkill(skills[i]);
					}
				}
				event.cards = player.getCards("hejsx");
				if (event.cards.length) {
					player.discard(event.cards).forceDie = true;
				}
			}
			("step 3");
			if (event.reserveOut) player.classList.add("out");
			if (source && lib.config.border_style == "auto" && (lib.config.autoborder_count == "kill" || lib.config.autoborder_count == "mix")) {
				switch (source.node.framebg.dataset.auto) {
					case "gold":
					case "silver":
						source.node.framebg.dataset.auto = "gold";
						break;
					case "bronze":
						source.node.framebg.dataset.auto = "silver";
						break;
					default:
						source.node.framebg.dataset.auto = lib.config.autoborder_start || "bronze";
				}
				if (lib.config.autoborder_count == "kill") {
					source.node.framebg.dataset.decoration = source.node.framebg.dataset.auto;
				} else {
					var dnum = 0;
					for (var j = 0; j < source.stat.length; j++) {
						if (source.stat[j].damage != undefined) {
							dnum += source.stat[j].damage;
						}
					}
					source.node.framebg.dataset.decoration = "";
					switch (source.node.framebg.dataset.auto) {
						case "bronze":
							if (dnum >= 4) {
								source.node.framebg.dataset.decoration = "bronze";
							}
							break;
						case "silver":
							if (dnum >= 8) {
								source.node.framebg.dataset.decoration = "silver";
							}
							break;
						case "gold":
							if (dnum >= 12) {
								source.node.framebg.dataset.decoration = "gold";
							}
							break;
					}
				}
				source.classList.add("topcount");
			}
		},
		subSkill: {
			die: {
				trigger: {
					player: "phaseAfter",
				},
				forced: true,
				forceDie: true,
				content() {
					"step 0";
					if (lib.skill.mrjijie.isSingleHaiguoshishen(player)) {
						if (!player.getStorage("mrjijie").length) {
							game.broadcastAll(function (player) {
								player.name1 = player.name;
								player.node.name.innerHTML = get.slimName(player.name);
								delete player.name2;
								delete player.skin.name2;
								player.classList.remove("fullskin2");
								player.node.avatar2.classList.add("hidden");
								player.node.name2.innerHTML = "";
								if (player == game.me && ui.fakeme) {
									ui.fakeme.style.backgroundImage = player.node.avatar.style.backgroundImage;
								}
							}, player);
						}
					}
					if (!player.getStorage("mrjijie").length) {
						game.delay();
					}
					("step 1");
					player.die();
				},
				sub: true,
				sourceSkill: "mrjuezhan",
				_priority: 0,
			},
			return: {
				trigger: {
					player: "phaseBefore",
				},
				forced: true,
				charlotte: true,
				silent: true,
				forceDie: true,
				forceOut: true,
				filter(event, player) {
					return !event._mrjuezhan_return && event.player.isOut() && _status.mrjuezhan_return[event.player.playerid];
				},
				content() {
					"step 0";
					trigger._mrjuezhan_return = true;
					game.broadcastAll(function (player) {
						player.classList.remove("out");
					}, trigger.player);
					game.log(trigger.player, "移回了游戏");
					delete _status.mrjuezhan_return[trigger.player.playerid];
					trigger.player.recover(trigger.player.maxHp - trigger.player.hp);
					game.broadcastAll(function (player) {
						if (player.name1 == "mr_linglushanzhihun") {
							player.smoothAvatar(false);
							player.node.avatar.setBackground(player.name1, "character");
							if (!lib.skill.mrjijie.isSingleHaiguoshishen(player)) {
								player.skin.name = player.name1;
							}
						}
						if (player.name2 == "mr_linglushanzhihun") {
							player.smoothAvatar(true);
							player.node.avatar2.setBackground(player.name2, "character");
							if (!lib.skill.mrjijie.isSingleHaiguoshishen(player)) {
								player.skin.name2 = player.name2;
							}
						}
					}, trigger.player);
					("step 1");
					event.trigger("restEnd");
					if (!player.hasSkill("mrjijie", null, null, false)) {
						event.finish();
					}
					("step 2");
					delete player.storage.mrjijie_current;
					if (lib.skill.mrjijie.isSingleHaiguoshishen(player)) {
						game.broadcastAll(function (player) {
							player.name1 = player.name;
							player.skin.name = player.name;
							player.smoothAvatar(false);
							player.node.avatar.setBackground(player.name, "character");
							player.node.name.innerHTML = get.slimName(player.name);
							delete player.name2;
							delete player.skin.name2;
							player.classList.remove("fullskin2");
							player.node.avatar2.classList.add("hidden");
							player.node.name2.innerHTML = "";
							if (player == game.me && ui.fakeme) {
								ui.fakeme.style.backgroundImage = player.node.avatar.style.backgroundImage;
							}
						}, player);
					}
					("step 3");
					var next = game.createEvent("mrjijie_clique");
					next.player = player;
					next.setContent(lib.skill.mrjijie.contentx);
					("step 4");
					player.draw();
				},
				sub: true,
				sourceSkill: "mrjuezhan",
				popup: false,
				_priority: 1,
			},
		},
		_priority: 1500,
	},
	hgjianyu: {
		enable: "phaseUse",
		usable: 1,
		init: function (player) {
			player.storage.hgjianyu_target = null;
		},
		filter: function (event, player) {
			return game.countPlayer(p => {
				return p != player && p.isIn();
			});
		},
		filterTarget: function (card, player, target) {
			return target != player && target.isIn();
		},
		async content(event, trigger, player) {
			let target = event.target;
			player.storage.hgjianyu_target = target;
			await target.out("hgjianyu");
			await player.addTempSkill("hgjianyu_damage", { player: "phaseUseEnd" });
		},
		subSkill: {
			damage: {
				forced: true,
				locked: true,
				silent: true,
				trigger: {
					source: "damageEnd",
				},
				init: function (player) {
					player.storage.hgjianyu_damage = 0;
				},
				async content(event, trigger, player) {
					player.storage.hgjianyu_damage++;
				},
				onremove: function (player, skill) {
					let target = player.storage.hgjianyu_target;
					if (target.isOut()) target.in("hgjianyu");
					target.damage(Math.max(player.storage.hgjianyu_damage, 1), player);
					player.storage.hgjianyu_target = null;
				},
			},
		},
	},
	hglangqing: {
		enable: "phaseUse",
		usable: 1,
		init: function (player) {
			player.storage.hglangqing = [];
		},
		filter: function (event, player) {
			return game.countPlayer(p => {
				return player.canUse({ name: "wanjian" }, p, false);
			});
		},
		async content(event, trigger, player) {
			let card = { name: "wanjian", isCard: true };
			await player.chooseUseTarget(card, true);
		},
		group: ["hglangqing_damage", "hglangqing_choose"],
		subSkill: {
			damage: {
				forced: true,
				locked: true,
				silent: true,
				trigger: {
					source: "damageEnd",
				},
				filter: function (event, player) {
					return event.getParent(4).name == "hglangqing";
				},
				async content(event, trigger, player) {
					player.storage.hglangqing.add(trigger.player);
				},
			},
			choose: {
				forced: true,
				locked: true,
				trigger: {
					player: "hglangqingAfter",
				},
				filter: function (event, player) {
					return player.storage.hglangqing.length;
				},
				async content(event, trigger, player) {
					const result = await player
						.chooseTarget("浪倾：请选择对一名角色造成1点伤害", function (card, player, target) {
							return player.storage.hglangqing.includes(target);
						})
						.set("ai", function (target) {
							return 1 - get.attitude(player, target);
						})
						.forResult();
					if (result.bool) await result.targets[0].damage(player);
					player.storage.hglangqing = [];
				},
			},
		},
	},
	hgjinggu: {
		forced: true,
		locked: true,
		trigger: {
			source: "damageBegin1",
		},
		filter: function (event, player) {
			return event.player != player;
		},
		async content(event, trigger, player) {
			const result = await player.judge().forResult();
			if (result.color == "red") await trigger.num++;
			else await player.gainPlayerCard("hej", trigger.player, true);
		},
	},
	hgchuixuan: {
		enable: "phaseUse",
		init: function (player) {
			player.storage.hgchuixuan = 0;
		},
		usable: function (skill, player) {
			return 1 + player.storage.hgchuixuan;
		},
		filter: function (event, player) {
			return game.countPlayer(p => {
				return player.canCompare(p, false, false);
			});
		},
		filterTarget: function (card, player, target) {
			return player.canCompare(target, false, false);
		},
		async content(event, trigger, player) {
			let target = event.target;
			const result = await player.chooseToCompare(target).forResult();
			if (result.bool) {
				target.damage(player);
				player.storage.hgchuixuan++;
			} else {
				var evt = _status.event;
				for (var i = 0; i < 10; i++) {
					if (evt && evt.getParent) {
						evt = evt.getParent();
					}
					if (evt.name == "phaseUse") {
						evt.skipped = true;
						break;
					}
				}
			}
		},
		group: "hgchuixuan_clear",
		subSkill: {
			clear: {
				forced: true,
				locked: true,
				silent: true,
				priority: -1,
				trigger: {
					player: "phaseAfter",
				},
				async content(event, trigger, player) {
					player.storage.hgchuixuan = 0;
				},
			},
		},
	},
	hgxiedu: {
		enable: "phaseUse",
		usable: 1,
		filterTarget: function (card, player, target) {
			return player != target;
		},
		async content(event, trigger, player) {
			event.target.addSkill(["hgxiedu_add", "hgxiedu_clear"]);
		},
		subSkill: {
			tag: {
				marktext: "毒",
				intro: {
					name: "百蝎之毒",
					content: "当前共有#层蝎毒",
				},
			},
			add: {
				forced: true,
				locked: true,
				init: function (player) {
					player.addMark("hgxiedu_tag");
				},
				trigger: {
					player: ["damageEnd", "phaseEnd"],
				},
				async content(event, trigger, player) {
					player.addMark("hgxiedu_tag");
				},
			},
			clear: {
				forced: true,
				locked: true,
				trigger: {
					player: "hgxiedu_addAfter",
				},
				filter: function (event, player) {
					return player.countMark("hgxiedu_tag") == 5;
				},
				async content(event, trigger, player) {
					await player.loseHp();
					await player.removeMark("hgxiedu_tag", 5);
				},
			},
		},
	},
	hgyuanmou: {
		trigger: {
			player: "phaseUseBegin",
		},
		filter: function (event, player) {
			return game.hasPlayer(function (current) {
				return player != current && get.distance(player, current) <= 2;
			});
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt2("hgyuanmou"), function (card, player, target) {
					return target != player && get.distance(player, target) <= 2;
				})
				.set("ai", function (target) {
					return 1 - get.attitude(player, target);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			player.gainPlayerCard(event.targets[0], "he", [1, 2]);
		},
	},
	hgyingchu: {
		trigger: {
			player: "useCard2",
		},
		filter(event, player) {
			if (event.card.name != "sha" && get.type(event.card) != "trick") return false;
			return game.hasPlayer(function (current) {
				return !event.targets.includes(current) && get.distance(player, current) <= 1 && player.canUse(event.card, current);
			});
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(get.prompt("hgyingchu"), "为" + get.translation(trigger.card) + "增加一个目标", function (card, player, target) {
					return !_status.event.sourcex.includes(target) && get.distance(player, target) <= 1 && player.canUse(_status.event.card, target);
				})
				.set("sourcex", trigger.targets)
				.set("ai", function (target) {
					var player = _status.event.player;
					return get.effect(target, _status.event.card, player, player);
				})
				.set("card", trigger.card)
				.forResult();
		},
		async content(event, trigger, player) {
			trigger.targets.push(event.targets[0]);
		},
	},
	hghuangquan: {
		trigger: {
			player: "useCardAfter",
		},
		filter(event, player) {
			return (event.card.name == "sha" || get.type(event.card) == "trick") && event.targets.filter(p => p.isIn());
		},
		async content(event, trigger, player) {
			const result = await player.judge().forResult();
			if (get.type(result.card) == get.type(trigger.card))
				player
					.useCard(
						trigger.card,
						trigger.targets.filter(p => p.isIn())
					)
					.set("cards", trigger.cards);
			else player.gain(result.card, "gain2");
		},
	},
	hglingxun: {
		enable: "phaseUse",
		usable: 2,
		filter(event, player) {
			return player.countCards("hes") > 0;
		},
		chooseButton: {
			dialog(event, player) {
				var list = [];
				for (var i = 0; i < lib.inpile.length; i++) {
					var name = lib.inpile[i];
					if (name == "sha") {
						list.push(["基本", "", "sha"]);
						for (var j of lib.inpile_nature) {
							list.push(["基本", "", "sha", j]);
						}
					} else if (get.type(name) == "trick") {
						list.push(["锦囊", "", name]);
					} else if (get.type(name) == "basic") {
						list.push(["基本", "", name]);
					}
				}
				return ui.create.dialog("灵巡", [list, "vcard"]);
			},
			filter(button, player) {
				return _status.event.getParent().filterCard({ name: button.link[2] }, player, _status.event.getParent());
			},
			check(button) {
				var player = _status.event.player;
				if (player.countCards("hs", button.link[2]) > 0) {
					return 0;
				}
				if (button.link[2] == "wugu") {
					return;
				}
				var effect = player.getUseValue(button.link[2]);
				if (effect > 0) {
					return effect;
				}
				return 0;
			},
			backup(links, player) {
				return {
					filterCard: true,
					selectCard: 1,
					popname: true,
					check(card) {
						return 6 - get.value(card);
					},
					position: "hes",
					viewAs: { name: links[0][2], nature: links[0][3] },
				};
			},
			prompt(links, player) {
				return "将一张牌当做" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]) + "使用";
			},
		},
		ai: {
			order: 4,
			result: {
				player: 1,
			},
			threaten: 1.9,
		},
	},
	hglongjuan: {
		trigger: {
			player: "useCardToPlayered",
		},
		filter(event, player) {
			return event.card.name == "sha";
		},
		check: function (event, player) {
			return 1 - get.attitude(player, event.target);
		},
		async content(event, trigger, player) {
			trigger.target.damage(player, "notrigger");
		},
	},
	mrshenyu: {
		forced: true,
		locked: true,
		firstDo: true,
		trigger: {
			source: "damageBefore",
		},
		init: function (player) {
			player.storage.mrshenyu = [];
			player.addMark("mrshenyu_tag", 6);
		},
		filter: function (event, player) {
			return (event.num >= event.player.hp && !event.player.hasSkill("mrleizhong") && !player.storage.mrshenyu.includes(event.player)) || event.player.hasSkill("mrleizhong");
		},
		async content(event, trigger, player) {
			if (!trigger.player.hasSkill("mrleizhong")) {
				player.storage.mrshenyu.add(trigger.player);
				await trigger.player.addSkill("mrleizhong");
			}
			await trigger.cancel();
		},
		group: ["mrshenyu_die", "mrshenyu_lose"],
		global: "mrshenyu_sha",
		subSkill: {
			tag: {
				marktext: "斩",
				intro: {
					name: "天羽羽斩",
					content: "当前共有#层天羽羽斩",
				},
			},
			lose: {
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					player: "phaseEnd",
				},
				async content(event, trigger, player) {
					if (player.hujia > 0) player.changeHujia(-player.hujia);
				},
			},
			die: {
				forced: true,
				locked: true,
				firstDo: true,
				trigger: {
					player: "phaseBegin",
				},
				filter: function (event, player) {
					return game.hasPlayer(p => p.hasSkill("mrleizhong")) || player.countMark("mrshenyu_tag") < 6;
				},
				async content(event, trigger, player) {
					if (player.countMark("mrshenyu_tag") < 6) await player.addMark("mrshenyu_tag", 6 - player.countMark("mrshenyu_tag"));
					let targets = game.filterPlayer(p => p.hasSkill("mrleizhong"));
					if (targets.length) for (var i = 0; i < targets.length; i++) await targets[i].die();
				},
			},
			sha: {
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					if (player.hasSkill("mrshenyu")) return false;
					return (
						player.countCards("he") &&
						game.filterPlayer(function (current) {
							return current.hasSkill("mrshenyu") && current.countMark("mrshenyu_tag");
						}).length
					);
				},
				filterCard: true,
				delay: false,
				discard: false,
				lose: false,
				position: "he",
				prompt() {
					var player = _status.event.player;
					var list = game.filterPlayer(function (current) {
						return current.hasSkill("mrshenyu");
					});
					var str = "将一张牌交给" + get.translation(list);
					if (list.length > 1) str += "中的一人";
					return str + "然后令其视为对一名角色使用雷【杀】";
				},
				check(card) {
					return 8 - get.value(card);
				},
				async content(event, trigger, player) {
					var targets = game.filterPlayer(function (current) {
						return current.hasSkill("mrshenyu") && current.countMark("mrshenyu_tag");
					});
					let target = targets[0];
					if (targets.length > 1) {
						const result = await player
							.chooseTarget(true, "选择【神域】交给牌的目标", function (card, player, target) {
								return _status.event.list.includes(target);
							})
							.set("list", targets)
							.set("ai", function (target) {
								var player = _status.event.player;
								return get.attitude(player, target);
							})
							.forResult();
						if (result.bool) target = result.targets[0];
					}
					await player.give(event.cards, target);
					const result2 = await player
						.chooseTarget(true, "选择【神域】让" + get.translation(target) + "使用雷【杀】的目标", function (card, player, targett) {
							return targett != target;
						})
						.set("ai", function (targett) {
							return get.effect(targett, { name: "sha" }, target, target) * get.attitude(player, target);
						})
						.forResult();
					await target.removeMark("mrshenyu_tag");
					await target.useCard({ name: "sha", isCard: true, nature: "thunder" }, result2.targets[0], false);
					await target.changeHujia(1, "gain", 3);
					await player.addTempSkill("mrshenyu_not");
				},
				ai: {
					order: 3,
					threaten: 1.5,
					result: {
						player(player) {
							var target1 = game.findPlayer(function (current) {
								return !current.hasSkill("mrshenyu") && player != current && get.attitude(player, current) < 0;
							});
							var target2 = game.findPlayer(function (current) {
								return current.hasSkill("mrshenyu") && player != current;
							});
							if (target2 && get.attitude(player, target2) > 0) return 3;
							if (target1) return 1;
							else return -3;
						},
					},
				},
			},
			not: {
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					source: "damageBefore",
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
				marktext: "威",
				mark: true,
				intro: {
					content: "你已使用天威，本回合无法造成伤害。",
				},
				ai: {
					effect: {
						player(card, player, target) {
							if (get.tag(card, "damage")) return 0;
						},
					},
				},
			},
		},
	},
	mrleizhong: {
		init: function (player, skill) {
			player.addSkillBlocker(skill);
			player.storage.mrleizhong_maxHp = player.maxHp;
			if (player.storage.mrleizhong_maxHp > 1) player.maxHp = 1;
			player.update();
			player.storage.mrleizhong_name = [player.name1];
			if (player.name2) player.storage.mrleizhong_name.add(player.name2);
			let chosen = "mr_leizhong";
			game.broadcastAll(
				function (first, player) {
					player.name1 = first;
					player.smoothAvatar(false);
					player.node.avatar.setBackground(first, "character");
					player.node.name.innerHTML = get.slimName(first);
					player.skin.name = first;
					if (player.storage.mrleizhong_name.length > 1) {
						delete player.name2;
						delete player.skin.name2;
						player.classList.remove("fullskin2");
						player.node.avatar2.classList.add("hidden");
						player.node.name2.innerHTML = "";
					}
					if (player == game.me && ui.fakeme) {
						ui.fakeme.style.backgroundImage = player.node.avatar.style.backgroundImage;
					}
				},
				chosen,
				player
			);
			game.log(player, "被镇压成了", "#g" + "【雷冢】");
		},
		skillBlocker(skill, player) {
			return skill != "mrleizhong";
		},
		onremove: function (player, skill) {
			player.removeSkillBlocker(skill);
			player.maxHp = player.storage.mrleizhong_maxHp;
			player.hp = 1;
			player.update();
			game.broadcastAll(function (player) {
				let first = player.storage.mrleizhong_name[0];
				player.name1 = first;
				player.node.avatar.setBackground(first, "character");
				player.node.name.innerHTML = get.slimName(first);
				player.skin.name = first;
				if (player.storage.mrleizhong_name.length > 1) {
					let chose = player.storage.mrleizhong_name[1];
					player.name2 = chose;
					player.skin.name2 = chose;
					player.classList.add("fullskin2");
					player.node.avatar2.classList.remove("hidden");
					player.node.avatar2.setBackground(chose, "character");
					player.node.name2.innerHTML = get.slimName(chose);
				}
				if (player == game.me && ui.fakeme) {
					ui.fakeme.style.backgroundImage = player.node.avatar.style.backgroundImage;
				}
			}, player);
			game.log(player, "被从", "#g" + "【雷冢】", "中解放了出来");
		},
		forced: true,
		locked: true,
		charlotte: true,
		trigger: {
			player: "phaseBefore",
		},
		async content(event, trigger, player) {
			trigger.cancel();
			game.log(player, "跳过了回合");
		},
		mod: {
			cardEnabled(card, player) {
				return false;
			},
			cardRespondable(card, player) {
				return false;
			},
			cardSavable(card, player) {
				return false;
			},
			cardDiscardable(card, player) {
				return false;
			},
		},
		ai: {
			maixie: true,
			maixie_hp: false,
			threaten: 0,
			effect: {
				target(card, player, target) {
					if (player.hasSkill("mrshenyu")) return "zeroplayertarget";
					if (get.tag(card, "damage") && !player.hasSkill("mrshenyu")) return -1;
				},
			},
		},
		group: "mrleizhong_recover",
		subSkill: {
			recover: {
				forced: true,
				locked: true,
				trigger: {
					player: "dyingBegin",
				},
				async content(event, trigger, player) {
					player.removeSkill("mrleizhong");
				},
			},
		},
		mark: true,
		marktext: "冢",
		intro: {
			content(storage, player, skill) {
				let str = "<li>你已被镇压成雷冢。你始终跳过回合。你无法使用、打出或弃置手牌。你的其他所有技能失效。";
				const list = player.getSkills(null, false, false).filter(function (i) {
					return lib.skill.rechanyuan.skillBlocker(i, player);
				});
				if (list.length) {
					str += "<br><li>失效技能：" + get.translation(list);
				}
				return str;
			},
		},
	},
	mrceshi: {
		trigger: {
			player: "enterGame",
			global: "phaseBefore",
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		forced: true,
		locked: false,
		content() {
			fellow = game.addPlayer(1, "mrlunyiailin");
		},
	},
	_mrxingdongtiao: {
		NpContent(player) {
			if (player == undefined) player = _status.event.player;
			let historyHtml = "";
			let historyLimit = lib.config?.extension_阴阳师_mrxingdongtiao_history || 10;
			if (historyLimit > 0) {
				let history = player.xingdongtiao?.History || [];
				if (history.length > 0) {
					historyHtml =
						'<div style="white-space:nowrap;">行动条变化：</div>' +
						history
							.slice(0, historyLimit)
							.map(record => {
								let color = record.change > 0 ? (lib.config.theme == "woodden" ? "#1E8449" : "#33d17a") : lib.config.theme == "woodden" ? "#CC0000" : "#ff6b6b";
								let sign = record.change > 0 ? "+" : "";
								return `<div style="font-size:0.8em; color:${color}; white-space:nowrap;">• ${record.reason}: ${sign}${record.change}</div>`;
							})
							.join("");
				}
			}
			const totalGained = player.xingdongtiao?.Gained || 0;
			const totalLost = player.xingdongtiao?.Lost || 0;
			return `
									<div style="white-space:nowrap;">当前行动条：<span style="color:${lib.config.theme == "woodden" ? "#3366FF" : "#66CCFF"}">${player.xingdongtiao?.Np}/${player.xingdongtiao?.Max}</span></div>
									<div style="white-space:nowrap;">累计获得：<span style="color:${lib.config.theme == "woodden" ? "#1E8449" : "#33d17a"}">${totalGained}</span></div>
									<div style="white-space:nowrap;">累计失去：<span style="color:${lib.config.theme == "woodden" ? "#CC0000" : "#ff6b6b"}">${totalLost}</span></div>
									${historyHtml}
									<div style="white-space:nowrap;">获取方式：</div>
									<div style="font-size:0.9em;white-space:nowrap;">• <span style="color:${lib.config.theme == "woodden" ? "#CC6600" : "#ff7800"}">发动行动技</span>可增加行动条</div>
									<div style="font-size:0.9em;white-space:nowrap;">• 行动条达到100%时，清空<br>行动条并进行一个额外回合。</div>
									`;
		},
		changeNp() {
			for (var i = 0; i < arguments.length; i++) {
				if (typeof arguments[i] === "number") var change = arguments[i];
				else if (typeof arguments[i] === "string") var reason = arguments[i];
				else if (typeof arguments[i] === "object") var player = arguments[i];
			}
			if (player == undefined) player = _status.event.player;
			if (!change) return false;
			if (player.xingdongtiao?.Skip.length > 0) {
				let match = player.xingdongtiao?.Skip.find(func => (typeof func == "function" ? func.name : func) == (_status.event.getParent(1).skill == "_mrxingdongtiao" ? _status.event.getParent(1).triggername : _status.event.getParent(1).skill));
				if (typeof match == "function") {
					if (match.call(_status.event.getParent(3))) {
						get.event().trigger("np_change");
						return false;
					}
				} else if (typeof match == "string") {
					get.event().trigger("np_change");
					return false;
				}
			}
			const currentNp = player.xingdongtiao.Np || 0;
			const maxNp = player.xingdongtiao.Max || 100;
			const newNp = currentNp + change;

			if (currentNp >= maxNp && change > 0) return false;

			if (!reason) {
				let eventName = get.translation(_status.event.name || "未知来源");
				reason = `因【${eventName}】`;
			}

			game.broadcastAll(
				function (player, change, reason, newNp) {
					if (!player.xingdongtiao.Gained) player.xingdongtiao.Gained = 0;
					if (!player.xingdongtiao.Lost) player.xingdongtiao.Lost = 0;
					if (!player.xingdongtiao.History) player.xingdongtiao.History = [];

					if (change > 0) {
						const actualGain = Math.min(change, player.xingdongtiao.Max - player.xingdongtiao.Np);
						player.xingdongtiao.Gained += actualGain;
					} else {
						player.xingdongtiao.Lost += Math.abs(change);
					}

					player.xingdongtiao.Np = Math.max(0, Math.min(newNp, player.xingdongtiao.Max));

					player.xingdongtiao.History.unshift({
						change: change,
						reason: reason,
					});
					if (player.xingdongtiao.History.length > 10) {
						player.xingdongtiao.History.pop();
					}

					get.event().trigger("np_change");
				},
				player,
				change,
				reason,
				newNp
			);
			return true;
		},
		changeMaxNp() {
			for (var i = 0; i < arguments.length; i++) {
				if (typeof arguments[i] === "number") var change = arguments[i];
				else if (typeof arguments[i] === "string") var reason = arguments[i];
				else if (typeof arguments[i] === "object") var player = arguments[i];
			}
			if (player == undefined) player = _status.event.player;
			if (!change) return false;
			if (change < 0) change = 0;
			if (change === player.xingdongtiao.Max) return false;

			if (!reason) {
				let eventName = get.translation(_status.event.name || "未知来源");
				reason = eventName.includes("【") ? eventName : `因【${eventName}】`;
			}

			game.broadcastAll(
				function (player, change, reason) {
					let oldMax = player.xingdongtiao.Max || 100;
					player.xingdongtiao.Max = change;
					if (player.xingdongtiao.Np >= player.xingdongtiao.Max) {
						player.xingdongtiao.Np = player.xingdongtiao.Max;
					}

					if (!player.xingdongtiao.History) {
						player.xingdongtiao.History = [];
					}

					let diff = change - oldMax;
					if (diff !== 0) {
						player.xingdongtiao.History.unshift({
							change: diff,
							reason: `${reason}上限${diff > 0 ? "增加" : "减少"}`,
						});
						if (player.xingdongtiao.History.length > 10) {
							player.xingdongtiao.History.pop();
						}
					}

					get.event().trigger("np_change");
				},
				player,
				change,
				reason
			);
			return true;
		},
		trigger: {
			global: ["gameStart", "phaseEnd"],
			player: ["phaseBeginStart", "useCardBegin", "damageBegin", "gainBegin", "np_change"],
			source: "damageBegin",
		},
		marktext: "Np",
		intro: {
			name: `
								<div style="text-align:center">
								<div style="font-size:1.2em">${_status.event.player?.xingdongtiao.Name || "行动条"}</div>
								<div style="font-size:0.7em; white-space:nowrap; color:${lib.config.theme == "woodden" ? "#888" : "#aaa"}">用于《阴阳师》扩展</div>
								</div>
							`,
			markcount(storage, player) {
				return player.xingdongtiao.Np;
			},
			content(storage, player) {
				return lib.skill._mrxingdongtiao.NpContent();
			},
			...{ ...(_status.event.player?.xingdongtiao.Image ? { markimage: player.xingdongtiao.Image } : {}) },
		},
		filter: function (event, player, onrewrite) {
			var current = game.expandSkills(player.getSkills());
			for (var skill of current) {
				let info = get.info(skill);
				if (info && info.actionSkill) {
					if (onrewrite != "phaseEnd") return true;
					else return player.xingdongtiao?.Np == 100;
				}
			}
			return false;
		},
		lastDo: true,
		forced: true,
		popup: false,
		silent: true,
		fixed: true,
		superCharlotte: true,
		create(player) {
			game.broadcastAll(function (player) {
				let double = player.classList.contains("fullskin2") && lib.config.layout !== "long2";
				const width = player.node.avatar.clientWidth;
				let w = width * (double ? 2 : 1);
				const bar = ui.create.div();
				bar.className = "energy-bar";

				const isMobile = lib.device == "android" || lib.device == "ios";
				const heightMultiplier = isMobile ? 0.15 : 0.1;
				const topOffset = lib.config.extension_阴阳师_mrxingdongtiao_top != 0 ? lib.config.extension_阴阳师_mrxingdongtiao_top : isMobile ? 0.2 : 0.15;

				bar.style.cssText = `
									z-index: 3;
									width: ${w * 1.05}px;
									height: ${w * heightMultiplier}px;
									position: absolute;
									top: ${w * -topOffset}px;
									border: 2px solid rgba(0, 0, 0, 0.9);
									border-radius: ${w * 0.05}px;
									background: rgba(0, 0, 0, 0.6);
									overflow: hidden;
									box-sizing: border-box;
									box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
								`;
				bar.setNodeIntro(
					`
									<div style="text-align:center">
									<div style="font-size:1.2em">${player.xingdongtiao.Name}</div>
									<div style="font-size:0.7em; white-space:nowrap; color:${lib.config.theme == "woodden" ? "#888" : "#aaa"}">用于《阴阳师》扩展</div>
									</div>
									`,
					lib.skill._mrxingdongtiao.NpContent(player)
				);
				const fill = ui.create.div();
				fill.className = "energy-fill";
				fill.style.cssText = `
									width: 0%;
									height: 100%;
									position: absolute;
									left: 0;
									top: 0;
									transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
									opacity: 1;
									background-size: 200% 100%;
								`;
				const label = ui.create.div();
				label.className = "energy-label";
				label.style.cssText = `
									position: absolute;
									width: 100%;
									height: 100%;
									display: flex;
									align-items: center;
									justify-content: center;
									color: #ffffff;
									font-size: ${w * 0.08}px;
									font-weight: bold;
									text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
									z-index: 1;
								`;
				bar.appendChild(fill);
				bar.appendChild(label);
				player.appendChild(bar);
			}, player);
		},
		content() {
			"step 0";
			event.style = lib.config?.extension_阴阳师_mrxingdongtiao || 1;
			if (event.triggername == "gameStart") {
				game.broadcastAll(function (player) {
					player.xingdongtiao = {
						Np: player.xingdongtiao?.Np || 0,
						Max: player.xingdongtiao?.Max || 100,
						History: player.xingdongtiao?.History || null,
						Gained: player.xingdongtiao?.Gained || null,
						Lost: player.xingdongtiao?.Lost || null,
						Enable: player.xingdongtiao?.Enable ?? true,
						Skip: player.xingdongtiao?.Skip || [],
						Name: player.xingdongtiao?.Name || "行动条",
						Color: player.xingdongtiao?.Color || null,
					};
				}, player);
				if (!player.xingdongtiao.Enable) return;
				if (!player.hasSkill("subplayer")) {
					if (event.style == "1") {
						lib.skill._mrxingdongtiao.create(player);
					} else if (event.style == "2") {
						player.updateMark("_mrxingdongtiao");
						player.markSkill("_mrxingdongtiao");
					}
				}
			}
			("step 1");
			if (event.triggername == "phaseEnd") {
				game.log(player, "的行动条达到100%，清空行动条并进行一个新的回合");
				lib.skill._mrxingdongtiao.changeNp(-100, "清空行动条");
				player.insertPhase("满行动条");
				event.finish();
			} else if (event.triggername != "np_change") {
				let change = 0;
				let reason = "";
				if (trigger && trigger.skill) {
					let skillName = get.translation(trigger.skill);
					skillName = skillName.includes("【") ? skillName : `【${skillName}】`;
					reason = `因${skillName}`;
				} else if (event.triggername == "gainBegin") {
					change = trigger.cards.length;
					let source = trigger.source || "系统";
					if (typeof source === "object" && source.name) {
						source = get.translation(source.name);
					}
					reason += source === "系统" ? "获得牌" : `从${source}获得牌`;
				} else if (event.triggername == "phaseBeginStart") {
					change = 5;
					reason += "回合开始";
				} else if (event.triggername == "damageBegin") {
					change = trigger.num;
					if (player == trigger.source) {
						let target = trigger.player;
						reason += `对${get.translation(target.name)}造成伤害`;
					} else {
						let source = trigger.source;
						reason += source ? `受到${get.translation(source.name)}的伤害` : "受到伤害";
					}
				} else if (event.triggername == "useCardBegin") {
					change = 1;
					let cardName = get.translation(trigger.card.name);
					reason += `使用【${cardName}】`;
				} else if (event.triggername == "gameStart") {
					change = 15;
					reason += "游戏开始";
				}

				lib.skill._mrxingdongtiao.changeNp(player, change, reason);
				event.finish();
			} else {
				game.broadcastAll(function (player) {
					if (event.style == "1") {
						if (!player.xingdongtiao.Enable) {
							player.querySelector(".energy-bar")?.delete();
							return;
						}
						if (!player.querySelector(".energy-bar")) {
							player.unmarkSkill("_mrxingdongtiao");
							lib.skill._mrxingdongtiao.create(player);
						}
						let energy = player.xingdongtiao.Np || 0;
						let maxEnergy = player.xingdongtiao.Max || 100;
						const bar = player.querySelector(".energy-bar");
						if (!bar) return;
						const fill = bar.querySelector(".energy-fill");
						const label = bar.querySelector(".energy-label");
						if (fill && label) {
							let percentage = (energy / maxEnergy) * 100;
							fill.style.width = `${percentage >= 0 ? percentage : 0}%`;
							const gradient = player.xingdongtiao?.Color || `${percentage <= 25 ? "linear-gradient(90deg, #1a5fb4 0%, #3584e4 50%, #62a0ea 100%, #1a5fb4 200%)" : percentage <= 50 ? "linear-gradient(90deg, #26a269 0%, #33d17a 50%, #8ff0a4 100%, #26a269 200%)" : percentage <= 75 ? "linear-gradient(90deg, #e66100 0%, #ffa348 50%, #ffbe6f 100%, #e66100 200%)" : "linear-gradient(90deg, #c01c28 0%, #ff7800 50%, #ffb380 100%, #c01c28 200%)"}`;
							fill.style.background = gradient;
							fill.style.boxShadow = `0 0 15px ${percentage <= 25 ? "#3584e4cc" : percentage <= 50 ? "#33d17acc" : percentage <= 75 ? "#ffa348cc" : '${lib.config.theme== "woodden" ?  "#CC6600":"#ff7800"}cc'}`;
							label.innerHTML = `${Math.round(energy)}/${maxEnergy}`;
							label.style.textShadow = `0 0 8px ${percentage <= 25 ? "#3584e4" : percentage <= 50 ? "#33d17a" : percentage <= 75 ? "#ffa348" : '${lib.config.theme== "woodden" ?  "#CC6600":"#ff7800"}'}`;

							bar.nodeContent = lib.skill._mrxingdongtiao.NpContent(player);
						}
					} else if (event.style == "2") {
						if (!player.xingdongtiao.Enable) {
							player.unmarkSkill("_mrxingdongtiao");
							return;
						}
						if (player.querySelector(".energy-bar")) {
							player.querySelector(".energy-bar")?.delete();
						}
						player.updateMark("_mrxingdongtiao");
					}
				}, player);
			}
		},
	},
	nuqi: {
		trigger: {
			player: "damageEnd",
		},
		forced: true,
		init(player, skill) {
			player.xingdongtiao = {
				Skip: ["gameStart", "useCardBegin", "gainBegin", "phaseBeginStart", "damageBegin"], // 跳过 游戏开始时、回合开始时、使用牌时、获得牌时、造成伤害、受到伤害时的能量回复
				Name: "怒气条", // 充能条名称为
				Color: "#DC143C", // 颜色为：猩红色，支持渐变色
				Max: 15, // 充能条上限
				Np: 2, // 充能起始值
			};
		},
		content() {
			"step 0";
			lib.skill._mrxingdongtiao.changeNp(5); // 获得五点充能，获取历史显示为“因【怒气】：+5”，可以自定义原因
			("step 1");
			if (player.xingdongtiao.Np >= player.xingdongtiao.Max) {
				lib.skill._mrxingdongtiao.changeNp(-10, "怒火攻心"); // 怒气值不小于上限时，扣除10点充能
				lib.skill._mrxingdongtiao.changeNp(-5, "怒火焚天", trigger.source); // 扣除攻击者5点能量
			}
		},
	},
	mryiyi: {
		comboSkill: true,
		usable: 2,
		mod: {
			aiOrder(player, card, num) {
				if (typeof card == "object") {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && get.tag(evt.card, "damage") > 0.5 && !evt.mryiyi && !evt.mreryi && get.tag(card, "damage") > 0.5) {
						return num + 10;
					}
				}
			},
		},
		trigger: {
			player: "useCard",
		},
		filter(event, player) {
			if (!get.tag(event.card, "damage")) {
				return false;
			}
			const evt = lib.skill.dcjianying.getLastUsed(player, event);
			if (!evt || !evt.card || evt.mryiyi || evt.mreryi) {
				return false;
			}
			return get.tag(evt.card, "damage") > 0.5;
		},
		check(event, player) {
			let eff = 0,
				l = event.targets.length;
			for (let i = 0; i < l; i++) {
				if (get.attitude(player, event.targets[i]) <= 0) eff++;
				else eff--;
			}
			return eff;
		},
		async content(event, trigger, player) {
			const { targets, name } = event;
			trigger.set(name, true);
			for (var target of trigger.targets) await target.damage(player);
		},
		init(player, skill) {
			player.addSkill(skill + "_combo");
		},
		onremove(player, skill) {
			player.removeSkill(skill + "_combo");
		},
		ai: {
			tag: {
				damage: 1,
			},
		},
		subSkill: {
			combo: {
				init(player, skill) {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && get.tag(evt.card, "damage") > 0.5 && !evt[skill] && !evt["mreryi"]) {
						player.addTip(skill, "一一 可连击");
					}
				},
				onremove(player, skill) {
					player.removeTip(skill);
				},
				charlotte: true,
				trigger: {
					player: ["useCard1", "useCardAfter"],
				},
				forced: true,
				popup: false,
				firstDo: true,
				async content(event, trigger, player) {
					if (event.triggername == "useCard1") {
						if (get.tag(trigger.card, "damage") > 0.5) {
							player.addTip("mryiyi", "一一 可连击");
							player.addMark("mryiyi_combo");
						} else {
							player.removeTip("mryiyi");
							player.removeMark("mryiyi_combo", player.countMark("mryiyi_combo"));
						}
					} else if (trigger.mryiyi || trigger.mreryi) {
						player.removeTip("mryiyi");
						player.removeMark("mryiyi_combo", player.countMark("mryiyi_combo"));
					}
				},
				marktext: "一",
				intro: {
					content: "准备好打出势大力沉的一击吧！",
					markcount() {
						return 0;
					},
				},
				sub: true,
				sourceSkill: "mryiyi",
				_priority: 0,
			},
		},
	},
	mryier: {
		comboSkill: true,
		usable: 2,
		mod: {
			aiOrder(player, card, num) {
				if (typeof card == "object") {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && get.tag(evt.card, "damage") > 0.5 && !evt.mryier && !evt.mryiyi && !evt.mreryi && !get.tag(card, "damage")) {
						return num + 10;
					}
				}
			},
		},
		trigger: {
			player: "useCard",
		},
		filter(event, player) {
			if (get.tag(event.card, "damage")) {
				return false;
			}
			const evt = lib.skill.dcjianying.getLastUsed(player, event);
			if (!evt || !evt.card || evt.mryier || evt.mryiyi || evt.mreryi) {
				return false;
			}
			return get.tag(evt.card, "damage") > 0.5;
		},
		check(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			const { targets, name } = event;
			trigger.set(name, true);
			player.draw(3);
		},
		init(player, skill) {
			player.addSkill(skill + "_combo");
		},
		onremove(player, skill) {
			player.removeSkill(skill + "_combo");
		},
		subSkill: {
			combo: {
				init(player, skill) {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && get.tag(evt.card, "damage") > 0.5 && !evt[skill] && !evt["mryiyi"] && !evt["mreryi"]) {
						player.addTip(skill, "一二 可连击");
					}
				},
				onremove(player, skill) {
					player.removeTip(skill);
				},
				charlotte: true,
				trigger: {
					player: ["useCard1", "useCardAfter"],
				},
				forced: true,
				popup: false,
				firstDo: true,
				async content(event, trigger, player) {
					if (event.triggername == "useCard1") {
						if (get.tag(trigger.card, "damage") > 0.5) {
							player.addTip("mryier", "一二 可连击");
							player.addMark("mryier_combo");
						} else {
							player.removeTip("mryier");
							player.removeMark("mryier_combo", player.countMark("mryier_combo"));
						}
					} else if (trigger.mryier || trigger.mryiyi || trigger.mreryi) {
						player.removeTip("mryier");
						player.removeMark("mryier_combo", player.countMark("mryier_combo"));
					}
				},
				marktext: "三",
				intro: {
					content: "准备好积攒实力吧！",
					markcount() {
						return 0;
					},
				},
				sub: true,
				sourceSkill: "mryier",
				_priority: 0,
			},
		},
	},
	mrerer: {
		comboSkill: true,
		usable: 2,
		mod: {
			aiOrder(player, card, num) {
				if (typeof card == "object") {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && !get.tag(evt.card, "damage") && !evt.mrerer && !evt.mryier && !get.tag(card, "damage")) {
						return num + 10;
					}
				}
			},
		},
		trigger: {
			player: "useCard",
		},
		filter(event, player) {
			if (get.tag(event.card, "damage")) {
				return false;
			}
			const evt = lib.skill.dcjianying.getLastUsed(player, event);
			if (!evt || !evt.card || evt.mrerer || evt.mryier) {
				return false;
			}
			return !get.tag(evt.card, "damage");
		},
		check(event, player) {
			return true;
		},
		async content(event, trigger, player) {
			const { targets, name } = event;
			trigger.set(name, true);
			player.recover();
			player.draw();
		},
		init(player, skill) {
			player.addSkill(skill + "_combo");
		},
		onremove(player, skill) {
			player.removeSkill(skill + "_combo");
		},
		subSkill: {
			combo: {
				init(player, skill) {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && !get.tag(evt.card, "damage") && !evt[skill] && !evt["mryier"]) {
						player.addTip(skill, "二二 可连击");
					}
				},
				onremove(player, skill) {
					player.removeTip(skill);
				},
				charlotte: true,
				trigger: {
					player: ["useCard1", "useCardAfter"],
				},
				forced: true,
				popup: false,
				firstDo: true,
				async content(event, trigger, player) {
					if (event.triggername == "useCard1") {
						if (!get.tag(trigger.card, "damage")) {
							player.addTip("mrerer", "二二 可连击");
							player.addMark("mrerer_combo");
						} else {
							player.removeTip("mrerer");
							player.removeMark("mrerer_combo", player.countMark("mrerer_combo"));
						}
					} else if (trigger.mrerer || trigger.mryier) {
						player.removeTip("mrerer");
						player.removeMark("mrerer_combo", player.countMark("mrerer_combo"));
					}
				},
				marktext: "二",
				intro: {
					content: "准备好休养生息吧！",
					markcount() {
						return 0;
					},
				},
				sub: true,
				sourceSkill: "mrerer",
				_priority: 0,
			},
		},
	},
	mreryi: {
		comboSkill: true,
		usable: 2,
		mod: {
			aiOrder(player, card, num) {
				if (typeof card == "object") {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && !get.tag(evt.card, "damage") && !evt.mryier && !evt.mrerer && !evt.mreryi && get.tag(card, "damage") > 0.5) {
						return num + 10;
					}
				}
			},
		},
		trigger: {
			player: "useCard",
		},
		filter(event, player) {
			if (!get.tag(event.card, "damage")) {
				return false;
			}
			const evt = lib.skill.dcjianying.getLastUsed(player, event);
			if (!evt || !evt.card || evt.mryier || evt.mrerer || evt.mreryi) {
				return false;
			}
			return !get.tag(evt.card, "damage");
		},
		check(event, player) {
			let eff = 0,
				l = event.targets.length;
			for (let i = 0; i < l; i++) {
				if (get.attitude(player, event.targets[i]) <= 0) eff += event.targets[i].maxHp - event.targets[i].hp;
				else eff -= event.targets[i].maxHp - event.targets[i].hp;
			}
			return eff;
		},
		async content(event, trigger, player) {
			const { targets, name } = event;
			trigger.set(name, true);
			for (var target of trigger.targets) await target.damage(player, target.maxHp - target.hp);
		},
		init(player, skill) {
			player.addSkill(skill + "_combo");
		},
		onremove(player, skill) {
			player.removeSkill(skill + "_combo");
		},
		ai: {
			tag: {
				damage: 1,
			},
		},
		subSkill: {
			combo: {
				init(player, skill) {
					const evt = lib.skill.dcjianying.getLastUsed(player);
					if (evt?.card && !get.tag(evt.card, "damage") && !evt[skill] && !evt["mrerer"] && !evt["mryier"]) {
						player.addTip(skill, "二一 可连击");
					}
				},
				onremove(player, skill) {
					player.removeTip(skill);
				},
				charlotte: true,
				trigger: {
					player: ["useCard1", "useCardAfter"],
				},
				forced: true,
				popup: false,
				firstDo: true,
				async content(event, trigger, player) {
					if (event.triggername == "useCard1") {
						if (!get.tag(trigger.card, "damage")) {
							player.addTip("mreryi", "二一 可连击");
							player.addMark("mreryi_combo");
						} else {
							player.removeTip("mreryi");
							player.removeMark("mreryi_combo", player.countMark("mreryi_combo"));
						}
					} else if (trigger.mryier || trigger.mrerer || trigger.mreryi) {
						player.removeTip("mreryi");
						player.removeMark("mreryi_combo", player.countMark("mreryi_combo"));
					}
				},
				marktext: "四",
				intro: {
					content: "准备好给予敌人致命一击吧！",
					markcount() {
						return 0;
					},
				},
				sub: true,
				sourceSkill: "mreryi",
				_priority: 0,
			},
		},
	},
	mrmianbi: {
		forced: true,
		clanSkill: true,
		locked: true,
		charlotte: true,
		firstDo: true,
		trigger: {
			player: "turnOverBefore",
		},
		async content(event, trigger, player) {
			trigger.cancel();
		},
		mod: {
			canBeGained(card, source, player) {
				if (get.position(card) == "h" && source != player) return false;
			},
		},
		group: "mrmianbi_wuxie",
		subSkill: {
			wuxie: {
				silent: true,
				firstDo: true,
				trigger: {
					player: "useCard",
				},
				forced: true,
				filter(event) {
					return get.type(event.card) == "trick";
				},
				content() {
					trigger.nowuxie = true;
				},
			},
		},
	},
	mrpobi: {
		locked: true,
		ai: {
			viewHandcard: true,
			skillTagFilter(player, tag, arg) {
				if (!arg.hasClan("面壁者") && !arg.hasClan("破壁者")) {
					return false;
				}
			},
		},
	},
	mryaolan: {
		marktext: "弹",
		intro: {
			name: "恒星级氢弹",
			content: "你已制造#个氢弹并连接上摇篮系统，等待死亡后引爆",
		},
		forced: true,
		locked: true,
		trigger: {
			player: "damageBegin2",
		},
		async content(event, trigger, player) {
			player.addMark("mryaolan", trigger.num);
		},
		group: "mryaolan_damage",
		subSkill: {
			damage: {
				forced: false,
				locked: true,
				forceDie: true,
				skillAnimation: true,
				animationColor: "thunder",
				trigger: {
					player: "dieAfter",
				},
				filter: function (event, player) {
					return player.countMark("mryaolan");
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseTarget("摇篮：是否发动")
						.set("ai", function (target) {
							return 1 - get.attitude(player, target);
						})
						.set("prompt2", "选择一名角色对其造成" + player.countMark("mryaolan") + "点伤害")
						.forResult();
				},
				async content(event, trigger, player) {
					let num = player.countMark("mryaolan");
					event.targets[0].damage(player, num);
				},
			},
		},
	},
	mrkongri: {
		forced: true,
		locked: true,
		trigger: {
			player: "damageBegin1",
		},
		filter: function (event, player) {
			return event.hasNature();
		},
		async content(event, trigger, player) {
			trigger.num++;
		},
	},
	mrjiandui: {
		enable: "phaseUse",
		usable: 1,
		init: function (player) {
			player.storage.mrjiandui = [];
		},
		filter: function (event, player) {
			return game.hasPlayer(p => p != player && p.name != "mr_liangziyouling");
		},
		check: function (event, player) {
			return true;
		},
		filterTarget: function (card, player, target) {
			return player != target && target.name != "mr_liangziyouling";
		},
		async content(event, trigger, player) {
			let players = game.players.sortBySeat(player),
				target = event.target;
			player.storage.mrjiandui.add(target);
			for (var p of players) {
				if (p == player || !target.isIn()) continue;
				const next = p
					.chooseToUse(
						"hj",
						function (card, player, event) {
							if (get.name(card) != "sha") {
								return false;
							}
							return lib.filter.filterCard.apply(this, arguments);
						},
						"是否替" + get.translation(player) + "对" + get.translation(target) + "使用一张杀？"
					)
					.set("targetRequired", true)
					.set("complexSelect", true)
					.set("complexTarget", true)
					.set("filterTarget", function (card, player, targe) {
						if (targe != target) {
							return false;
						}
						return lib.filter.targetEnabledx.apply(this, arguments);
					});
			}
		},
		ai: {
			order: 7,
			result: {
				target: -4,
			},
			tag: {
				damage: 1,
			},
		},
		group: "mrjiandui_source",
		subSkill: {
			source: {
				forced: true,
				locked: true,
				charlotte: true,
				silebt: true,
				trigger: {
					global: "useCard",
				},
				filter: function (event, player) {
					return event.card && event.card.name == "sha" && event.player != player && event.getParent(2).name == "mrjiandui";
				},
				async content(event, trigger, player) {
					trigger.customArgs.default.customSource = player;
				},
			},
		},
	},
	mrxisheng: {
		sunbenSkill: true,
		trigger: {
			global: "die",
		},
		filter: function (event, player) {
			if (player.hasSkill("mrxisheng_sunben")) return false;
			const target = event.player;
			if (get.is.playerNames(target, "mr_liangziyouling")) return false;
			if (event.reserveOut) return false;
			return player.storage.mrjiandui.includes(target);
		},
		forceDie: true,
		forced: true,
		async content(event, trigger, player) {
			await player.addSkill("mrxisheng_sunben");
			await trigger.cancel();
			let target = trigger.player;
			const names = get.nameList(target).filter(i => i !== "mr_liangziyouling");
			const result =
				names.length > 1
					? await player
							.chooseControl(names)
							.set("ai", () => {
								const { controls } = get.event();
								return controls.slice().sort((a, b) => get.rank(b, true) - get.rank(a, true));
							})
							.set("prompt", "请选择替换的武将牌")
							.forResult()
					: { control: names[0] };
			if (result.control) {
				game.broadcastAll(player => player.revive(3), target);
				let doubleDraw = false;
				let num = (get.character("mr_liangziyouling").maxHp || get.character("mr_liangziyouling").hp) - (get.character(result.control).maxHp || get.character(result.control).hp);
				if (num !== 0) {
					if (typeof target.singleHp === "boolean") {
						if (num % 2 !== 0) {
							if (target.singleHp) {
								target.maxHp += (num + 1) / 2;
								target.singleHp = false;
							} else {
								target.maxHp += (num - 1) / 2;
								target.singleHp = true;
								doubleDraw = true;
							}
						} else {
							target.maxHp += num / 2;
						}
					} else {
						target.maxHp += num;
					}
					target.update();
				}
				event.skills = get.character(result.control).skills || [];
				await target.reinitCharacter(result.control, "mr_liangziyouling");
				if (doubleDraw) {
					await target.doubleDraw();
				}
			}
		},
		subSkill: {
			sunben: {
				charlotte: true,
				onremove: true,
				mark: true,
				forced: true,
				popup: false,
				firstDo: true,
				marktext: "昂",
				intro: {
					markcount() {
						return 0;
					},
					content: "激昂：你击杀一名角色",
				},
				trigger: {
					source: "die",
				},
				content() {
					player.removeSkill("mrxisheng_sunben");
					player.popup("牺牲");
					game.log(player, "恢复了技能", "#g【牺牲】");
				},
			},
		},
	},
	mrliangzi: {
		trigger: {
			player: "changeCharacterAfter",
		},
		filter(event, player) {
			return event.getParent().name === "mrxisheng";
		},
		forced: true,
		async content(event, trigger, target) {
			let { player, skills } = trigger.getParent();
			player = player["mrliangzi"] || player;
			if (skills.length) {
				await target.addSkills(skills);
			}
			game.broadcastAll(
				(player, target) => {
					target["mrliangzi"] = player;
					const identity = (target.identity = (identity => {
						switch (identity) {
							case "zhu":
							case "mingzhong":
								return "zhong";
							case "zhu_false":
								return "zhong_false";
							case "bZhu":
								return "bZhong";
							case "rZhu":
								return "rZhong";
							default:
								return identity;
						}
					})(player.identity));
					if (!lib.translate[identity]) {
						lib.translate[identity] = "幽灵";
					}
					const goon = player !== game.me && target !== game.me && player.node.identity.classList.contains("guessing") && !player.identityShown;
					if (goon) {
						if (target.identityShown) {
							delete target.identityShown;
						}
						if (!target.node.identity.classList.contains("guessing")) {
							target.node.identity.classList.add("guessing");
						}
					}
					target.setIdentity(goon ? "cai" : undefined);
					if (target.node.dieidentity) {
						target.node.dieidentity.innerHTML = get.translation(target.identity + 2);
					}
					if (typeof player.ai?.shown === "number" && target.ai) {
						target.ai.shown = player.ai.shown;
					}
					if (player.side) {
						target.side = player.side;
						target.node.identity.firstChild.innerHTML = player.node.identity.firstChild.innerHTML;
						target.node.identity.dataset.color = player.node.identity.dataset.color;
					}
					if (_status._mrliangzi) {
						return;
					}
					_status.mrliangzi = true;
					//检测游戏胜负
					if (typeof game.checkResult === "function") {
						const origin_checkResult = game.checkResult;
						game.checkResult = function () {
							const player = game.me._trueMe || game.me;
							if (game.players.filter(i => i !== player).every(i => i["mrliangzi"] === (player["mrliangzi"] || player))) {
								game.over(true);
							}
							return origin_checkResult.apply(this, arguments);
						};
					}
					if (typeof game.checkOnlineResult === "function") {
						const origin_checkOnlineResult = game.checkOnlineResult;
						game.checkOnlineResult = function (player) {
							if (game.players.filter(i => i !== player).every(i => i["mrliangzi"] === (player["mrliangzi"] || player))) {
								return true;
							}
							return origin_checkOnlineResult.apply(this, arguments);
						};
					}
					if (typeof lib.element.player.getFriends === "function") {
						const origin_getFriends = lib.element.player.getFriends;
						const getFriends = function (func, includeDie) {
							const player = this;
							return [...origin_getFriends.apply(this, arguments), ...game[includeDie ? "filterPlayer2" : "filterPlayer"](target => (target["mrliangzi"] || target) === (player["mrliangzi"] || player))]
								.filter(i => i !== player || func === true)
								.unique()
								.sortBySeat(player);
						};
						lib.element.player.getFriends = getFriends;
						[...game.players, ...game.dead].forEach(i => (i.getFriends = getFriends));
					}
					if (typeof lib.element.player.isFriendOf === "function") {
						const origin_isFriendOf = lib.element.player.isFriendOf;
						const isFriendOf = function (player) {
							if ((this["mrliangzi"] || this) === (player["mrliangzi"] || player)) {
								return true;
							}
							return origin_isFriendOf.apply(this, arguments);
						};
						lib.element.player.isFriendOf = isFriendOf;
						[...game.players, ...game.dead].forEach(i => (i.isFriendOf = isFriendOf));
					}
					if (typeof lib.element.player.getEnemies === "function") {
						const origin_getEnemies = lib.element.player.getEnemies;
						const getEnemies = function (func, includeDie) {
							if (this["mrliangzi"]) {
								return this["mrliangzi"].getEnemies(func, includeDie);
							} else {
								const player = this;
								return [
									...origin_getEnemies.apply(this, arguments),
									...game[includeDie ? "filterPlayer2" : "filterPlayer"](target => {
										return origin_getEnemies.apply(this, arguments).includes(target["mrliangzi"] || target);
									}),
								]
									.filter(i => player != (i["mrliangzi"] || i))
									.unique()
									.sortBySeat(player);
							}
						};
						lib.element.player.getEnemies = getEnemies;
						[...game.players, ...game.dead].forEach(i => (i.getEnemies = getEnemies));
					}
				},
				player,
				target
			);
			target.ai.modAttitudeFrom = function (from, to) {
				if (to == from["mrliangzi"]) {
					return 114514;
				}
				return get.attitude(from["mrliangzi"] || from, to["mrliangzi"] || to);
			};
			target.ai.modAttitudeTo = function (from, to, att) {
				if (from == to["mrliangzi"]) {
					return 7;
				}
				return get.attitude(from["mrliangzi"] || from, to["mrliangzi"] || to);
			};
		},
		mark: true,
		marktext: "牢",
		intro: {
			name: "牢大",
			content: "孩子们我复活了，但是变成了量子幽灵",
		},
		group: ["mrliangzi_damage", "mrliangzi_maxhp"],
		subSkill: {
			damage: {
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					player: "damageBefore",
				},
				content() {
					trigger.cancel();
				},
				ai: {
					nodamage: true,
				},
			},
			maxhp: {
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					player: "phaseEnd",
				},
				content() {
					player.loseMaxHp();
				},
			},
		},
	},
	mrgangyin: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: true,
		init: function (player) {
			player.storage.mrgangyin = [];
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async content(event, trigger, player) {
			const result = await player
				.chooseTarget([1, 2], "钢印：选择至多两名其他角色打上思想钢印", lib.translate.mrgangyin_info, true, function (card, player, target) {
					return player != target;
				})
				.set("ai", function (target) {
					return 1 - get.attitude(player, target);
				})
				.forResult();
			for (var i of result.targets) {
				i.addMark("mrgangyin_tag");
				i.addSkill("mrshuidu");
				player.storage.mrgangyin.add(i);
			}
		},
		derivation: "mrshuidu",
		mark: true,
		marktext: "印",
		intro: {
			content: "已给$打上“思想钢印”",
		},
		group: "mrgangyin_poison",
		subSkill: {
			tag: {
				marktext: "印",
				intro: {
					name: "思想钢印",
					content: "你已被打上思想钢印！",
					markcount() {
						return 0;
					},
				},
			},
			poison: {
				trigger: {
					global: ["damageBefore", "recoverBefore"],
				},
				filter: function (event, player) {
					let evt = event.getParent(2);
					return evt?.card && evt.cards.length && evt.player.hasMark("mrgangyin_tag");
				},
				async content(event, trigger, player) {
					const result = await player.judge().forResult();
					if (get.color(trigger.getParent(2).card) != get.color(result.card)) {
						trigger.cancel();
						if (trigger.num > 0) {
							if (trigger.name == "recover") {
								let next = game.createEvent("loseHp");
								next.num = trigger.num;
								next.player = trigger.player;
								next.setContent("loseHp");
							} else {
								let next = game.createEvent("recover");
								next.num = trigger.num;
								next.player = trigger.player;
								next.setContent("recover");
							}
						}
						if (!trigger.player.hasMark("mrgangyin_tag") && !trigger.player.hasSkill("mrgangyin")) {
							trigger.player.addMark("mrgangyin_tag");
							trigger.player.addSkill("mrshuidu");
						}
					}
				},
			},
		},
	},
	mrshuidu: {
		mark: true,
		forced: true,
		locked: true,
		zhuanhuanji: true,
		marktext: "☯",
		intro: {
			content(storage, player, skill) {
				let str1 = player.storage.mrshuidu ? "<li>当前状态：你的所有黑色手牌均视为【杀】至下个回合开始" : "<li>当前状态：你的所有红色手牌均视为【桃】至下个回合开始";
				let str2 = player.storage.mrshuidu ? "<li>回合开始时，你的所有红色手牌均视为【桃】至下个回合开始" : "<li>回合开始时，你的所有黑色手牌均视为【杀】至下个回合开始";
				return str1 + str2;
			},
		},
		init: function (player) {
			player.storage.mrshuidu = true;
		},
		trigger: {
			player: "phaseBeginStart",
		},
		async content(event, trigger, player) {
			player.changeZhuanhuanji("mrshuidu");
		},
		mod: {
			cardname(card, player) {
				if (!player.storage.mrshuidu && get.color(card) == "red") {
					return "tao";
				}
				if (player.storage.mrshuidu && get.color(card) == "black") {
					return "sha";
				}
			},
		},
	},
	mrtaowang: {
		mod: {
			globalTo(from, to, distance) {
				let num = game.filterPlayer(p => p.hasMark("mrgangyin_tag")).length;
				return distance + num;
			},
		},
	},
	mrzhijian: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		forced: true,
		locked: true,
		init: function (player) {
			_status.mrzhijian = [];
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async content(event, trigger, player) {
			let num = game.countPlayer(p => p.group == "san");
			if (player.countMark("mrzhijian_tag") < 99) await player.addMark("mrzhijian_tag", Math.min(10 * num, 99 - player.countMark("mrzhijian_tag")));
			await game.addGlobalSkill("mrzhijian_heiansenlindaji");
			await player.$fullscreenpop("黑暗森林打击！", "thunder");
		},
		mark: true,
		marktext: "黑",
		intro: {
			name: "黑暗森林打击已开启",
			content() {
				let players = _status.mrzhijian,
					str = "当前暂无黑暗森林打击目标";
				if (players.length) {
					str = "当前黑暗森林打击目标为：";
					players.forEach(p => (str += get.translation(p) + " "));
				}
				return str;
			},
		},
		group: "mrzhijian_choose",
		subSkill: {
			tag: {
				marktext: "慑",
				intro: {
					name: "威慑度",
					content: "当前共有#点威慑度",
				},
			},
			heiansenlindaji: {
				forced: true,
				silent: true,
				charlotte: true,
				trigger: {
					player: "phaseBeginStart",
				},
				filter: function (event, player) {
					return _status.mrzhijian.length;
				},
				async content(event, trigger, player) {
					let players = _status.mrzhijian;
					for (var p of players) await p.damage(player);
				},
			},
			choose: {
				enable: "phaseUse",
				filter: function (event, player) {
					return player.countMark("mrzhijian_tag") == 99 && game.countPlayer(p => !_status.mrzhijian.includes(p));
				},
				filterTarget: function (card, player, target) {
					return !_status.mrzhijian.includes(target);
				},
				check: function (event, player) {
					return true;
				},
				skillAnimation: true,
				animationColor: "thunder",
				async content(event, trigger, player) {
					await _status.mrzhijian.add(event.target);
					player.removeMark("mrzhijian_tag", 99);
				},
				ai: {
					order: 9,
					result: {
						target(player, target) {
							return -114514;
						},
					},
				},
			},
		},
	},
	mrkuozhang: {
		forced: true,
		locked: true,
		charlotte: true,
		trigger: {
			player: "damageEnd",
		},
		filter: function (event, player) {
			return game.hasPlayer(p => p.isIn() && p != player && get.distance(player, p) == 1 && p.countGainableCards("hej"));
		},
		async content(event, trigger, player) {
			let players = game.filterPlayer(p => p.isIn() && p != player && get.distance(player, p) == 1 && p.countCards("hej"));
			for (let p of players) await player.gainPlayerCard(p, true).set("position", "hej");
			if (player.countMark("mrzhijian_tag") < 99) player.addMark("mrzhijian_tag", Math.min(5 * players.length, 99 - player.countMark("mrzhijian_tag")));
		},
		ai: {
			maixie: true,
			maixie_hp: true,
		},
	},
	mrcaiyi: {
		enable: "phaseUse",
		usable: 1,
		targetprompt: ["执行谋弈", "应对谋弈"],
		filter(event, player) {
			return game.countPlayer() > 1;
		},
		filterTarget: true,
		selectTarget: 2,
		multitarget: true,
		async content(event, trigger, player) {
			await player.draw();
			let target1 = event.targets[0],
				target2 = event.targets[1];
			const result = await target1
				.chooseToDuiben(target2)
				.set("title", "谋弈")
				.set("namelist", ["掩体计划", "光速飞船", "扔二向箔", "光粒打击"])
				.set("translationList", [`以防止${get.translation(target1)}对你造成1点伤害`, `以防止你减少一点体力上限`, `若成功，你令${get.translation(target2)}减少一点体力上限`, `若成功，你对${get.translation(target2)}造成1点伤害`])
				.set("ai", button => {
					var source = get.event().getParent().player,
						target = get.event().getParent().target;
					if (((!target.getCards("hs").filter(c => get.name(c) == "tao" || "jiu") && target.hp == 1) || (target.maxHp >= 4 && target.maxHp > target.hp * 2)) && button.link[2] == "db_atk1") return 10;
					if (target.hp == target.maxHp && button.link[2] == "db_atk2") return 10;
					if (!target.countCards("he") && target.hp == 1 && button.link[2] == "db_def2") return 10;
					if (target.hasSkillTag("maixie") && button.link[2] == "db_def1") return 2 + Math.random();
					return 1 + Math.random();
				})
				.forResult();
			if (result.bool) {
				if (result.player == "db_def1") target2.loseMaxHp();
				else target2.damage(target1);
			}
			if (player.countMark("mrzhijian_tag") < 99) player.addMark("mrzhijian_tag", Math.min(15, 99 - player.countMark("mrzhijian_tag")));
		},
		ai: {
			order: 8,
			result: {
				target(player, target) {
					if (ui.selected.targets.length == 0) {
						return 3;
					} else {
						return -3;
					}
				},
			},
			expose: 0.4,
			threaten: 3,
		},
	},
	mrlieren: {
		forced: false,
		locked: true,
		trigger: {
			global: "phaseUseBegin",
		},
		filter: function (event, player) {
			return event.player != player && player.inRange(event.player) && player.canUse({ name: "sha" }, event.player) && player.countCards("hej", { name: "sha" });
		},
		check: function (event, player) {
			return 1 - get.attitude(player, event.player);
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseToUse(function (card, player, event) {
					if (get.name(card) != "sha") {
						return false;
					}
					return lib.filter.filterCard.apply(this, arguments);
				}, "猎人：是否对" + get.translation(trigger.player) + "使用一张杀")
				.set("targetRequired", true)
				.set("complexSelect", true)
				.set("complexTarget", true)
				.set("filterTarget", function (card, player, target) {
					if (target != trigger.player) {
						return false;
					}
					return lib.filter.filterTarget.apply(this, arguments);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			if (player.countMark("mrzhijian_tag") < 99) player.addMark("mrzhijian_tag", Math.min(10, 99 - player.countMark("mrzhijian_tag")));
		},
		group: "mrlieren_tiaoxing",
		subSkill: {
			tiaoxing: {
				forced: true,
				locked: true,
				trigger: {
					player: "phaseUseBegin",
				},
				filter(event, player) {
					return game.hasPlayer(function (current) {
						return current.isEnemyOf(player) && player.inRangeOf(current);
					});
				},
				logTarget(event, player) {
					return game.filterPlayer(function (current) {
						return current.isEnemyOf(player) && player.inRangeOf(current);
					});
				},
				check: () => false,
				content() {
					"step 0";
					event.targets = game.filterPlayer(current => player.inRangeOf(current)).sortBySeat();
					("step 1");
					var target = event.targets.shift();
					if (target.isIn()) {
						event.target = target;
						target
							.chooseToUse(function (card, player, event) {
								if (get.name(card) != "sha") {
									return false;
								}
								return lib.filter.filterCard.apply(this, arguments);
							}, "猎人：对" + get.translation(player) + "使用一张杀，或令其弃置你的一张牌")
							.set("targetRequired", true)
							.set("complexSelect", true)
							.set("complexTarget", true)
							.set("filterTarget", function (card, player, target) {
								if (target != _status.event.sourcex && !ui.selected.targets.includes(_status.event.sourcex)) {
									return false;
								}
								return lib.filter.filterTarget.apply(this, arguments);
							})
							.set("sourcex", player);
					} else if (targets.length) {
						event.redo();
					} else {
						event.finish();
					}
					("step 2");
					if (result.bool == false && target.countCards("he") > 0) {
						player.discardPlayerCard(target, "he", true);
					}
					if (targets.length) {
						event.goto(1);
					}
				},
			},
		},
	},
	mrjihua: {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		forced: true,
		init: function (player) {
			player.storage.mrjihua = [];
		},
		filter(event, player) {
			return player.getCards("s").filter(card => card.name.indexOf("mrjihua_") == 0).length < 4;
		},
		async content(event, trigger, player) {
			let list = ["mr_taile", "mr_leidiyazi", "mr_xiensi", "mr_luoji"],
				huase = ["spade", "heart", "club", "diamond"];
			game.addVideo("skill", player, ["mrjihua", [list]]);
			game.broadcastAll(
				function (player, list) {
					player.tempname.addArray(list);
					for (var name of list) {
						lib.skill.mrjihua.createCard(name);
					}
				},
				player,
				list
			);
			let ccards = player.getCards("s");
			for (var c of ccards) if (c.name.indexOf("mrjihua_") == 0 && list.includes(c.name.slice(8))) list.remove(c.name.slice(8));
			var cards = list.map(function (name) {
				let huase1 = huase.randomGet();
				var card = game.createCard("mrjihua_" + name, huase1, "none");
				return card;
			});
			player.$gain2(cards);
			player.directgains(cards, null, "eternal_mianbi");
		},
		createCard(name) {
			if (!_status.postReconnect.mrjihua) {
				_status.postReconnect.mrjihua = [
					function (list) {
						for (var name of list) {
							lib.skill.mrjihua.createCard(name);
						}
					},
					[],
				];
			}
			_status.postReconnect.mrjihua[1].add(name);
			if (!lib.card["mrjihua_" + name]) {
				if (lib.translate[name + "_ab"]) {
					lib.translate["mrjihua_" + name] = lib.translate[name + "_ab"];
				} else {
					lib.translate["mrjihua_" + name] = lib.translate[name];
				}
				var info = lib.character[name];
				var card = {
					fullimage: true,
					image: "character:" + name,
					type: "trick",
					enable: false,
					//cardcolor: "none",
					toself: true,
					modTarget: true,
					content() {},
					ai: {},
				};
				let str = "面壁者化为的锦囊牌，可以当做任意基本牌或普通锦囊牌使用或打出。当你失去此牌后，将其销毁。";
				lib.translate["mrjihua_" + name + "_info"] = str;
				lib.card["mrjihua_" + name] = card;
			}
		},
		mod: {
			cardUsable: function (card, player, num) {
				if (!player.getCards("s").filter(i => i.name.indexOf("mrjihua_") == 0).length) return Infinity;
			},
		},
		group: ["mrjihua_destroy", "mrjihua_use", "mrjihua_clear"],
		subSkill: {
			destroy: {
				forced: true,
				trigger: {
					global: ["loseEnd", "equipEnd", "addJudgeEnd", "gainEnd", "loseAsyncEnd", "addToExpansionEnd"],
				},
				filter: function (event, player) {
					return event.cards && event.cards.some(i => i.hasGaintag("eternal_mianbi"));
				},
				async content(event, trigger, player) {
					let cards = trigger.cards.filter(i => i.hasGaintag("eternal_mianbi")),
						ccards = player.getCards("s").filter(i => i.name.indexOf("mrjihua_") == 0),
						cardss = [];
					let suits = ["spade", "heart", "club", "diamond"];
					for (var c of ccards) if (suits.includes(get.suit(c))) suits.remove(get.suit(c));
					game.cardsGotoSpecial(cards);
					game.log(cards, "被销毁了");
					while (suits.length) {
						var suit = suits.shift();
						var card = get.cardPile(cardx => {
							return get.suit(cardx, false) == suit;
						});
						if (card) {
							cardss.push(card);
						}
					}
					if (cardss.length) {
						player.gain(cardss, "gain2");
					}
				},
			},
			use: {
				enable: ["chooseToUse", "chooseToRespond"],
				filter(event, player) {
					return player.getCards("s").filter(card => card.name.indexOf("mrjihua_") == 0).length;
				},
				chooseButton: {
					dialog(event, player) {
						var list = [];
						for (var i = 0; i < lib.inpile.length; i++) {
							var name = lib.inpile[i];
							if (name == "sha") {
								list.push(["基本", "", "sha"]);
								for (var j of lib.inpile_nature) {
									list.push(["基本", "", "sha", j]);
								}
							} else if (get.type(name) == "trick") {
								list.push(["锦囊", "", name]);
							} else if (get.type(name) == "basic") {
								list.push(["基本", "", name]);
							}
						}
						return ui.create.dialog("计划", [list, "vcard"]);
					},
					filter(button, player) {
						if (player.storage.mrjihua.includes(button.link[2])) return false;
						return _status.event.getParent().filterCard({ name: button.link[2] }, player, _status.event.getParent());
					},
					check(button) {
						var player = _status.event.player;
						if (player.countCards("hs", button.link[2]) > 0) {
							return 0;
						}
						if (button.link[2] == "wugu") {
							return;
						}
						var effect = player.getUseValue(button.link[2]);
						if (effect > 0) {
							return effect;
						}
						return 0;
					},
					backup(links, player) {
						return {
							filterCard: function (card) {
								return card.name.indexOf("mrjihua_") == 0;
							},
							selectCard: 1,
							popname: true,
							check(card) {
								return 6 - get.value(card);
							},
							position: "s",
							viewAs: { name: links[0][2], nature: links[0][3] },
							onuse: function () {
								player.storage.mrjihua.add(links[0][2]);
							},
						};
					},
					prompt(links, player) {
						return "将一张牌当做" + (get.translation(links[0][3]) || "") + get.translation(links[0][2]) + "使用";
					},
				},
				hiddenCard: function (player, name) {
					if (!lib.inpile.contains(name)) return false;
					var type = get.type2(name);
					return (type == "basic" || type == "trick") && player.getCards("s").filter(card => card.name.indexOf("mrjihua_") == 0).length;
				},
				ai: {
					order: 4,
					result: {
						player: 1,
					},
					threaten: 1.9,
				},
			},
			clear: {
				forced: true,
				locked: true,
				charlotte: true,
				silent: true,
				trigger: {
					player: "phaseAfter",
				},
				filter: function (event, player) {
					return player.storage.mrjihua.length;
				},
				async content(event, trigger, player) {
					player.storage.mrjihua = [];
				},
			},
		},
	},
	mrtanxing: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		forced: true,
		content: function () {
			let cards = player.getCards("h").filter(card => !card.hasGaintag("共享"));
			player.addGaintag(cards, "eternal_mrtanxing_tag");
		},
		derivation: "mrzuobiao",
		group: ["mrtanxing_lose"],
		subSkill: {
			lose: {
				trigger: {
					player: "loseAfter",
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				filter: function (event, player) {
					var evt = event.getl(player);
					return evt && evt.cards && evt.cards.some(i => i.hasGaintag("eternal_mrtanxing_tag"));
				},
				async cost(event, trigger, player) {
					let players = game.filterPlayer(p => p != player && !p.hasSkill("mrzuobiao"));
					if (players.length)
						event.result = await player
							.chooseTarget("弹星：是否选择一名角色获得【坐标】，然后对所有拥有【坐标】的角色造成1点伤害", function (card, player, target) {
								return players.includes(target);
							})
							.set("ai", function (target) {
								return 1 - get.attitude(player, target);
							})
							.forResult();
					else
						event.result = await player
							.chooseBool("弹星：是否对所有拥有【坐标】的角色造成1点伤害")
							.set("ai", function (target) {
								return 1;
							})
							.forResult();
				},
				async content(event, trigger, player) {
					if (event.targets) await event.targets[0].addSkill("mrzuobiao");
					game.countPlayer(p => {
						if (p.hasSkill("mrzuobiao")) p.damage(player);
					});
				},
			},
		},
	},
	mrzuobiao: {
		mod: {
			globalTo(from, to, distance) {
				return 1;
			},
		},
		global: "mrzuobiao_effect",
		subSkill: {
			effect: {
				mod: {
					cardUsable(card, player, num) {
						if (player._countPrenum) return;
						if (card.name == "sha") return Infinity;
					},
					playerEnabled(card, player, target) {
						if (card.name != "sha") return;
						player._countPrenum = true;
						const num = player.getCardUsable(card);
						delete player._countPrenum;
						if (num > 0) return;
						if (game.checkMod(card, player, target, false, "cardUsableTarget", player)) return;
						if (!target.hasSkill("mrzuobiao")) return false;
					},
				},
			},
		},
	},
	mrbaolu: {
		forced: true,
		locked: true,
		skillAnimation: true,
		animationColor: "thunder",
		unique: true,
		juexingji: true,
		derivation: "mrqingli",
		trigger: {
			global: "dieAfter",
		},
		filter: function (event, player) {
			return event.player.hasSkill("mrzuobiao");
		},
		async content(event, trigger, player) {
			await player.awakenSkill("mrbaolu");
			const ccards = Array.from(ui.discardPile.childNodes).filter(card => card.hasGaintag("eternal_mrtanxing_tag"));
			await player.gain(ccards, "gain2");
			game.countPlayer(p => {
				if (p != player) player.gainPlayerCard(p, true);
			});
			let cards = Array.from(ui.cardPile.childNodes),
				num = cards.length;
			if (num == 1) {
				cards[0].addGaintag("eternal_mrbaolu_tag");
			} else if (num >= 2) {
				let n = 2,
					r = [];
				while (n) {
					let nn = Math.round(Math.random() * num);
					if (r.includes(nn)) continue;
					r.add(nn);
					n--;
				}
				cards[r[0]].addGaintag("eternal_mrbaolu_tag");
				cards[r[1]].addGaintag("eternal_mrbaolu_tag");
			}
			await player.addSkill("mrqingli");
		},
	},
	mrqingli: {
		enable: "phaseUse",
		usable: 1,
		init() {
			game.broadcastAll(() => lib.skill.mrqingli.video());
		},
		video() {
			const namex = "mrqingli_card";
			lib.card[namex] = {
				type: "special_delay",
				fullskin: true,
				noEffect: true,
				wuxieable: false,
			};
			lib.translate[namex] = "二向箔·清理";
			lib.translate[namex + "_info"] = "由【清理】技能创造的无效果延时性锦囊牌【二向箔·清理】";
		},
		filterCard: function (card) {
			return card.hasGaintag("eternal_mrbaolu_tag");
		},
		filterTarget: function (card, player, target) {
			return target.canAddJudge(get.autoViewAs({ name: "mrqingli_card" }, [card]));
		},
		check(card) {
			return 7 - get.value(card);
		},
		position: "hes",
		filter(event, player) {
			return player.countCards("hes", card => card.hasGaintag("eternal_mrbaolu_tag")) > 0;
		},
		discard: false,
		lose: false,
		delay: false,
		forced: false,
		locked: true,
		prepare: "give",
		async content(event, trigger, player) {
			game.addVideo("skill", player, ["mrqingli", []]);
			let target = event.targets[0];
			player.logSkill("mrqingli", target);
			await game.delay(0.5);
			target.addJudge({ name: "mrqingli_card" }, event.cards);
		},
		global: "mrqingli_judge",
		group: ["mrqingli_manyan", "mrqingli_effect"],
		subSkill: {
			effect: {
				forced: true,
				locked: true,
				trigger: {
					global: "phaseJudgeBegin",
				},
				filter: function (event, player) {
					return event.player.countCards("j", card => {
						let name = card.viewAs ? card.viewAs : card.name;
						return name == "mrqingli_card";
					});
				},
				async content(event, trigger, player) {
					let p = trigger.player;
					const result = await p
						.chooseVCardButton(["lebu", "bingliang", "shandian"], "立世：请选择两个延时锦囊并依次进行判定", 2, true)
						.set("ai", button => {
							return get.info({ name: button.link[2] }).ai.result.target(p, p);
						})
						.forResult();
					if (result?.links.length) {
						const links = result.links;
						for (let i = 0; i < links.length; i++) {
							await p.executeDelayCardEffect(links[i][2]);
						}
					}
					let cards = p.getCards("j");
					p.discard(cards);
				},
			},
			judge: {
				forced: true,
				locked: true,
				popup: false,
				trigger: {
					player: "addJudgeAfter",
				},
				filter: function (event, player) {
					return event.card.name == "mrqingli_card";
				},
				async content(event, trigger, player) {
					let cards = player.getCards("j", card => {
						let name = card.viewAs ? card.viewAs : card.name;
						return name != "mrqingli_card";
					});
					player.discard(cards);
				},
				mod: {
					targetEnabled(card, player, target) {
						const name = typeof card == "string" ? card : card.viewAs ? card.viewAs : card.name;
						if (name == "mrqingli_card" && target.hasJudge(name)) {
							return false;
						} else if (get.type(card) == "delay" && target.hasJudge("mrqingli_card")) {
							return false;
						}
					},
				},
			},
			manyan: {
				silent: true,
				lastDo: true,
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					global: "phaseEnd",
				},
				async content(event, trigger, player) {
					let cards = Array.from(ui.cardPile.childNodes),
						num = cards.length;
					if (num >= 2) {
						if (cards[0].hasGaintag("eternal_mrbaolu_tag") && !cards[1].hasGaintag("eternal_mrbaolu_tag")) cards[1].addGaintag("eternal_mrbaolu_tag");
						if (cards[num - 1].hasGaintag("eternal_mrbaolu_tag") && !cards[num - 2].hasGaintag("eternal_mrbaolu_tag")) cards[num - 2].addGaintag("eternal_mrbaolu_tag");
						if (num >= 3) {
							for (var i = 1; i < num - 1; i++) {
								if (cards[i].hasGaintag("eternal_mrbaolu_tag")) {
									if (!cards[i + 1].hasGaintag("eternal_mrbaolu_tag")) cards[i + 1].addGaintag("eternal_mrbaolu_tag");
									if (!cards[i - 1].hasGaintag("eternal_mrbaolu_tag")) cards[i - 1].addGaintag("eternal_mrbaolu_tag");
								}
							}
						}
					}
				},
			},
		},
	},
	mrjinghua: {
		trigger: {
			player: "phaseZhunbeiBegin",
		},
		content() {
			next = game.createEvent("mrjinghua");
			next.player = player;
			next.setContent(lib.skill.mrjinghua.contentx);
		},
		contentx() {
			let skills = player.getSkills(null, false, false),
				listm = [],
				cards = player.getCards("j");
			if (player.name1 != undefined) listm = lib.character[player.name1][3];
			else listm = lib.character[player.name][3];
			if (player.name2 != undefined) listm = listm.concat(lib.character[player.name2][3]);
			for (var mark in player.marks) {
				let bool = 1;
				for (var sk of listm) {
					if (mark.indexOf(sk) == 0) {
						bool = 0;
						break;
					}
				}
				if (bool) player.removeMark(mark, 999);
			}
			for (let skill of skills) {
				let info = get.info(skill),
					bool = 1;
				for (var sk of listm) {
					if (skill.indexOf(sk) == 0) {
						bool = 0;
						break;
					}
				}
				if (info && !info.persevereSkill && !listm.includes(skill) && bool) player.removeSkill(skill);
			}
			player.discard(cards);
			player.link(false);
			player.turnOver(false);
			game.log(player, "清除了", "#g负面效果");
		},
	},
	mrshengmu: {
		isDamage(card) {
			if (card.name == "sha") return true;
			var info = lib.card[card.name];
			if (!info || info.type == "equip" || info.type == "delay") return false;
			if (info.ai.tag) return info.ai.tag["damage"];
			else return false;
		},
		mod: {
			cardname(card, player) {
				if (lib.skill.mrshengmu.isDamage(card)) return "tao";
			},
		},
	},
	mrgouhuo: {
		init: function (player) {
			player.storage.mrgouhuo = [[""], ["discard"], ["link"], ["drawDiscard"], ["damage"], ["shandian"], ["bingliang"], ["turnOver"], ["cardEnable"], ["loseNotForced"], ["loseForced"], ["loseRecover"], ["cardToPile"], ["discardColor"]];
		},
		trigger: {
			player: "changeHp",
		},

		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget("苟活：是否选择一名角色对其施加负面效果", function (card, player, target) {
					return target != player;
				})
				.set("ai", function (target) {
					return -get.attitude(player, target);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			let target = event.targets[0];
			const result = await target.judge().forResult();
			let num = result.number,
				numm = player.storage.mrgouhuo.length - 1,
				index = num % numm;
			if (index == 0) index = numm;
			let effect = player.storage.mrgouhuo[index];
			for (var name of effect) {
				if (!target.isIn()) break;
				switch (name) {
					case "discard":
						await target.chooseToDiscard(true, "he");
						break;
					case "shandian":
						if (target.canAddJudge({ name: "shandian" })) await target.addJudge({ name: "shandian" });
						break;
					case "bingliang":
						if (target.canAddJudge({ name: "bingliang" })) await target.addJudge({ name: "bingliang" });
						break;
					case "drawDiscard":
						await target.chooseToDiscard(true, "he", 2);
						await target.draw();
						break;
					case "damage":
						await target.damage(player);
						break;
					case "link":
						await target.link();
						break;
					case "turnOver":
						await target.turnOver();
						break;
					case "cardEnable":
						await target.addTempSkill("mrgouhuo_card");
						break;
					case "loseNotForced":
						await target.addTempSkill("fengyin");
						break;
					case "loseForced":
						await target.addTempSkill("mrgouhuo_fengyin");
						break;
					case "loseRecover":
						await target.loseHp();
						await target.draw();
						break;
					case "cardToPile":
						const result2 = await target.chooseCard(true, "苟活：交给" + get.translation(player) + "一张牌", "he").forResult();
						await target.give(result2.cards, player);
						game.log(target, "将", result2.cards, "交给了", player);
						break;
					case "discardColor":
						let color = result.color,
							cards = target.getCards("he", card => get.color(card) == color);
						await target.discard(cards);
						break;
				}
			}
			if (numm > 1) {
				if (index < numm) {
					let arr = player.storage.mrgouhuo[index + 1].concat(player.storage.mrgouhuo[index]);
					player.storage.mrgouhuo[index + 1] = [...new Set(arr)];
				}
				if (index > 1) {
					let arr = player.storage.mrgouhuo[index - 1].concat(player.storage.mrgouhuo[index]);
					player.storage.mrgouhuo[index - 1] = [...new Set(arr)];
				}
				player.storage.mrgouhuo.splice(index, 1);
			}
		},
		ai: {
			maixie_hp: true, // 优先回血
			maixie: true, // 卖血技
		},
		subSkill: {
			fengyin: {
				init: function (player, skill) {
					player.addSkillBlocker(skill);
					player.addTip(skill, "锁定技失效");
				},
				onremove: function (player, skill) {
					player.removeSkillBlocker(skill);
					player.removeTip(skill);
				},
				charlotte: true,
				skillBlocker: function (skill, player) {
					return !lib.skill[skill].persevereSkill && !lib.skill[skill].charlotte && get.is.locked(skill, player);
				},
				mark: true,
				marktext: "锁",
				intro: {
					content: function (storage, player, skill) {
						var list = player.getSkills(null, false, false).filter(function (i) {
							return lib.skill.mrgouhuo_fengyin.skillBlocker(i, player);
						});
						if (list.length) {
							return "失效技能：" + get.translation(list);
						}
						return "无失效技能";
					},
				},
			},
			card: {
				mark: true,
				marktext: "停",
				intro: {
					content: "本回合不能使用或打出手牌",
				},
				charlotte: true,
				mod: {
					cardEnabled2(card, player) {
						if (get.position(card) == "h") {
							return false;
						}
					},
				},
			},
		},
	},
	mrfeiai: {
		mod: {
			cardEnabled(card, player) {
				if (player.storage.mrfeiai >= player.maxHp + player.storage.mrfeiai_extra) {
					return false;
				}
			},
			cardUsable(card, player) {
				if (player.storage.mrfeiai >= player.maxHp + player.storage.mrfeiai_extra) {
					return false;
				}
			},
			cardSavable(card, player) {
				if (player.storage.mrfeiai >= player.maxHp + player.storage.mrfeiai_extra) {
					return false;
				}
			},
			maxHandcard: function (player, num) {
				return num + 2 + player.storage.mrfeiai_extra;
			},
		},
		trigger: {
			player: "useCard1",
		},
		forced: true,
		popup: false,
		firstDo: true,
		mark: true,
		marktext: "癌",
		intro: {
			content(storage, player, skill) {
				return "本回合还可以使用" + (player.maxHp - player.storage.mrfeiai + player.storage.mrfeiai_extra) + "张牌";
			},
			markcount(storage, player) {
				return player.storage.mrfeiai + "/" + (player.maxHp + player.storage.mrfeiai_extra);
			},
		},
		init(player, skill) {
			player.storage.mrfeiai = 0;
			player.storage.mrfeiai_extra = 0;
			player.getHistory("useCard", () => {
				player.storage.mrfeiai++;
			});
		},
		onremove(player) {
			delete player.storage.mrfeiai;
		},
		filter: function (event, player) {
			return event.getParent().name != "mranlian";
		},
		content() {
			player.storage.mrfeiai++;
			game.addVideo("storage", player, ["mrfeiai", player.storage.mrfeiai]);
		},
		group: ["mrfeiai_clear", "mrfeiai_lose"],
		subSkill: {
			clear: {
				charlotte: true,
				forced: true,
				silent: true,
				trigger: {
					global: "phaseEnd",
				},
				lastDo: true,
				content() {
					player.storage.mrfeiai = 0;
					game.addVideo("storage", player, ["mrfeiai", player.storage.mrfeiai]);
				},
				sub: true,
				_priority: 0,
			},
			lose: {
				charlotte: true,
				forced: true,
				trigger: {
					player: "phaseJieshu",
				},
				async content(event, trigger, player) {
					const list = [];
					list.push("选项一");
					list.push("选项二");
					list.push("背水！");
					const control = await player
						.chooseControl(list)
						.set("choiceList", ["失去一点体力，摸两张牌", "减少一点体力上限，获得1点护甲", "背水！对一名其它角色造成1点伤害，令描述①中的数字+1"])
						.set("prompt", get.prompt("mrfeiai"))
						.set("ai", () => {
							if (player.maxHp == player.hp) return "背水！";
							return "选项二";
						})
						.forResultControl();
					if (control == "背水！") {
						const result = await player
							.chooseTarget(true, "肺癌：选择一名其它角色对其造成1点伤害", function (card, player, target) {
								return target != player;
							})
							.set("ai", function (target) {
								return 1 - get.attitude(player, target);
							})
							.forResult();
						await result.targets[0].damage(player);
						player.storage.mrfeiai_extra++;
					}
					if (["选项一", "背水！"].includes(control)) {
						await player.loseHp();
						await player.draw(2);
					}
					if (["选项二", "背水！"].includes(control)) {
						await player.loseMaxHp();
						await player.changeHujia(1, "gain", 5);
					}
				},
			},
		},
		ai: {
			presha: true,
			pretao: true,
			neg: true,
			nokeep: true,
		},
	},
	mrzengxing: {
		trigger: {
			player: "useCardBefore",
		},
		filter(event, player) {
			return player.countCards("he", card => get.type(card) == "equip" && (event.cards ? !event.cards.includes(card) : true)) && player.isPhaseUsing();
		},
		async cost(event, trigger, player) {
			let ccard = trigger.card;
			event.result = await player
				.chooseCardTarget({
					filterCard: card => get.type(card) == "equip" && (trigger.cards ? !trigger.cards.includes(card) : true),
					filterTarget(card, player, target) {
						return player != target;
					},
					prompt: "赠星：是否交给一名其它角色一张装备牌，然后令该角色成为此牌的使用者",
					position: "he",
					ai1(card) {
						return 7 - get.value(card);
					},
					ai2(target) {
						if (["shan", "wuxie"].includes(ccard.name) || !trigger.target) return -1;
						return get.attitude(player, target) * get.effect(trigger.target, ccard, target, target);
					},
				})
				.forResult();
		},
		async content(event, trigger, player) {
			let card = event.cards[0],
				target = event.targets[0];
			await player.give(card, target);
			trigger.player = target;
			trigger.noai = true;
			game.delay(0.5);
		},
	},
	mranlian: {
		trigger: {
			player: "dying",
		},
		filter: function (event, player) {
			return _status.currentPhase != player && (player.hasSkill("mrzengxing") || player.hasSkill("mranle"));
		},
		async cost(event, trigger, player) {
			let bool = [1, player.hasSkill("mrzengxing"), player.hasSkill("mranle")],
				list = ["失去一点体力上限", "失去【赠星】", "失去【安乐】"];
			var choiceList = ui.create.dialog("暗恋：请选择一项", "forcebutton", "hidden");
			choiceList.add([
				list.map((item, i) => {
					if (!bool[i]) item = `<span style="text-decoration: line-through;">${item}</span>`;
					return [i, item];
				}),
				"textbutton",
			]);
			var next = player.chooseButton(choiceList);
			next.set("filterButton", function (button) {
				if (!bool[button.link]) return false;
				return true;
			}).set("ai", function (button) {
				if (button.link == 0 && player.maxHp > 1) return 1;
				if (button.link == 1) return 1;
				else if (button.link == 2) return -1;
			});
			const result = await next.forResult();
			const bo = result.bool;
			if (bo) {
				event.result = {
					bool: bo,
					cost_data: result.links[0],
				};
			} else {
				event.result = { bool: false };
			}
		},
		async content(event, trigger, player) {
			if (event.cost_data == 0) await player.loseMaxHp();
			else if (event.cost_data == 1) await player.removeSkill("mrzengxing");
			else await player.removeSkill("mranle");
			player.useCard({ name: "tao" }, player);
		},
	},
	mranle: {
		dutySkill: true,
		forced: true,
		locked: true,
		trigger: {
			global: "phaseEnd",
		},
		filter: function (event, player) {
			return player.getHistory("useCard").length == 0;
		},
		async content(event, trigger, player) {
			let num = game.countPlayer(p => p.group == trigger.player.group);
			await player.draw(num);
		},
		derivation: ["mrdanao", "mrtonghua"],
		group: ["mranle_achieve", "mranle_fail"],
		subSkill: {
			achieve: {
				trigger: {
					player: "dying",
				},
				forced: true,
				skillAnimation: true,
				animationColor: "fire",
				filter: function (event, player) {
					return _status.currentPhase == player;
				},
				async content(event, trigger, player) {
					await game.log(player, "成功完成安乐死");
					await player.awakenSkill("mranle");
					let num = player.countCards("h") - 4;
					if (num > 0) await player.chooseToDiscard(true, num, "h");
					else if (num < 0) await player.draw(-num);
					await player.recoverTo(2);
					await player.reinitCharacter(get.character(player.name2, 3).includes("mranle") ? player.name2 : player.name1, "mr_chengxin");
				},
			},
			fail: {
				trigger: {
					global: "phaseEnd",
				},
				forced: true,
				skillAnimation: true,
				animationColor: "fire",
				lastDo: true,
				filter: function (event, player) {
					return player.maxHp == 1;
				},
				async content(event, trigger, player) {
					await game.log(player, "成功阻止安乐死");
					await player.awakenSkill("mranle");
					await player.removeSkill("mrfeiai");
					await player.removeSkill("mrzengxing");
					await player.removeSkill("mranlian");
					player.maxHp = 4;
					await player.addSkill("mrdanao");
					await player.addSkill("mrtonghua");
					await player.draw(game.countGroup());
					await player.update();
				},
			},
		},
	},
	mrdanao: {
		popup: false,
		trigger: {
			player: ["phaseZhunbeiBefore", "phaseJieshuBefore", "phaseJudgeBefore", "phaseDiscardBefore"],
		},
		forced: true,
		content() {
			trigger.cancel();
		},
	},
	mrtonghua: {
		dutySkill: true,
		forced: true,
		locked: true,
		init: function (player) {
			player.storage.mrtonghua = 3;
			player.storage.mrtonghua_used = [];
			player.storage.mrtonghua_selected = null;
		},
		mark: true,
		intro: {
			content: function (storage) {
				return "当前共有" + storage + "个“童话”";
			},
		},
		trigger: {
			player: "phaseDrawBegin2",
		},
		filter(event, player) {
			return !event.numFixed;
		},
		async content(event, trigger, player) {
			trigger.num += player.storage.mrtonghua;
		},
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == "sha") return num + player.storage.mrtonghua;
			},
		},
		derivation: ["mrcuoguo", "mrsixian"],
		group: ["mrtonghua_use", "mrtonghua_achieve", "mrtonghua_fail"],
		subSkill: {
			use: {
				forced: true,
				locked: true,
				trigger: {
					player: "phaseUseEnd",
				},
				filter(event, player) {
					return player.storage.mrtonghua;
				},
				async content(event, trigger, player) {
					var list = ["针眼画师:选择一名其他角色，直到你的下回合开始，你的手牌和体力值调整至与其相等", "饕餮海:直到你的下回合开始，当其他角色使用牌指定你时，取消之", "深水王子:你的手牌始终为4至你的下回合开始"];
					var choiceList = ui.create.dialog("童话：请选择一项", "forcebutton", "hidden");
					choiceList.add([
						list.map((item, i) => {
							if (player.storage.mrtonghua_used.includes(i)) item = `<span style="text-decoration: line-through;">${item}</span>`;
							return [i, item];
						}),
						"textbutton",
					]);
					var next = player.chooseButton(choiceList, true);
					next.set("filterButton", function (button) {
						if (player.storage.mrtonghua_used.includes(button.link)) return false;
						return true;
					});
					const result = await next.forResult();
					if (result.links[0] == 0) {
						await player.addTempSkill("mrtonghua_one", { player: "phaseBeginStart" });
						const result2 = await player
							.chooseTarget(true, "针眼画师:选择一名其他角色，直到你的下回合开始，你的手牌和体力值调整至与其相等", function (card, player, target) {
								return target != player;
							})
							.forResult();
						let target = result2.targets[0];
						player.storage.mrtonghua_selected = target;
						player.hp = target.hp;
						let num = player.countCards("h") - target.countCards("h");
						if (num > 0) await player.chooseToDiscard(true, num, "h");
						else if (num < 0) await player.draw(-num);
						await player.update();
						player.storage.mrtonghua_used.add(0);
					} else if (result.links[0] == 1) {
						await player.addTempSkill("mrtonghua_two", { player: "phaseBeginStart" });
						player.storage.mrtonghua_used.add(1);
					} else if (result.links[0] == 2) {
						await player.addTempSkill("mrtonghua_three", { player: "phaseBeginStart" });
						player.storage.mrtonghua_used.add(2);
						let num = player.countCards("h") - 4;
						if (num > 0) await player.chooseToDiscard(true, num, "h");
						else if (num < 0) await player.draw(-num, "nodelay");
					}
					player.storage.mrtonghua--;
					game.addVideo("storage", player, ["mrtonghua", player.storage.mrtonghua]);
				},
			},
			one: {
				popup: false,
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					global: ["loseAfter", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter", "changeHp"],
					player: ["loseAfter", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter", "changeHp"],
				},
				filter: function (event, player) {
					return player.storage.mrtonghua_selected && (event.player == player.storage.mrtonghua_selected || event.player == player);
				},
				async content(event, trigger, player) {
					let target = player.storage.mrtonghua_selected;
					player.hp = target.hp;
					let num = player.countCards("h") - target.countCards("h");
					if (num > 0) {
						let cards = player.getDiscardableCards("h").randomGets(num);
						await player.discard(cards);
					} else if (num < 0) await player.draw(-num, "nodelay");
					await player.update();
				},
			},
			two: {
				popup: false,
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					target: "useCardToTarget",
				},
				filter: function (event, player) {
					return event.player != player;
				},
				async content(event, trigger, player) {
					trigger.targets.remove(player);
					trigger.getParent().triggeredTargets2.remove(player);
					trigger.untrigger();
				},
			},
			three: {
				popup: false,
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					player: ["loseAfter", "equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter", "changeHp"],
				},
				filter: function (event, player) {
					return player.getCards("h") != 4;
				},
				async content(event, trigger, player) {
					let num = player.countCards("h") - 4;
					if (num > 0) await player.chooseToDiscard(true, num, "h");
					else if (num < 0) await player.draw(-num);
				},
			},
			achieve: {
				forced: true,
				locked: true,
				charlotte: true,
				skillAnimation: true,
				animationColor: "fire",
				trigger: {
					player: "mrtonghua_useAfter",
				},
				filter: function (event, player) {
					return !player.storage.mrtonghua;
				},
				async content(event, trigger, player) {
					game.log(player, "成功完成使命");
					player.awakenSkill("mrtonghua");
					let num = player.countCards("h") - player.maxHp;
					if (num > 0) await player.chooseToDiscard(true, num, "h");
					else if (num < 0) await player.draw(-num);
					await player.addSkill("mrcuoguo");
				},
			},
			fail: {
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					player: "dying",
				},
				async content(event, trigger, player) {
					game.log(player, "使命失败");
					player.awakenSkill("mrtonghua");
					await player.loseMaxHp();
					await player.recoverTo(player.maxHp);
					await player.addSkill("mrsixian");
				},
			},
		},
	},
	mrcuoguo: {
		forced: true,
		locked: true,
		charlotte: true,
		trigger: {
			player: "phaseBegin",
		},
		init: function (player) {
			player.storage.mrcuoguo = null;
		},
		async content(event, trigger, player) {
			var next = player.chooseButton(['###错过：选择一种花色？###<div class="text center">你不能于本轮使用该花色，失去其它花色的牌后摸一张牌</div>', [lib.suit.map(i => ["", "", "lukai_" + i]), "vcard"]], true);
			const result = await next.forResult();
			let suit = result.links[0][2].slice(6);
			player.storage.mrcuoguo = suit;
			await player.addTempSkill("mrcuoguo_effect", { player: "phaseBeginStart" });
		},
		subSkill: {
			effect: {
				forced: true,
				locked: true,
				charlotte: true,
				popup: false,
				trigger: {
					player: "loseAfter",
					global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
				},
				filter: function (event, player) {
					var evt = event.getl(player);
					return player.storage.mrcuoguo && evt && evt.cards && evt.cards.some(i => get.suit(i) != player.storage.mrcuoguo);
				},
				async content(event, trigger, player) {
					player.draw("nodelay");
				},
				mod: {
					cardEnabled2(card, player) {
						if (get.suit(card) == player.storage.mrcuoguo) {
							return false;
						}
					},
				},
			},
		},
	},
	mrsixian: {
		forced: true,
		locked: true,
		charlotte: true,
		trigger: {
			player: "phaseEnd",
		},
		async content(event, trigger, player) {
			await player.draw(player.maxHp);
			await player.loseMaxHp();
			player.insertPhase("mrsixian");
		},
	},
	mrtongxin: {
		trigger: {
			global: "phaseBefore",
			player: "enterGame",
		},
		init: function (player) {
			player.storage.mrtongxin = [];
			player.storage.mrtongxin_p = [];
		},
		filter(event, player) {
			return event.name != "phase" || game.phaseNumber == 0;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget([0, 3], get.prompt2("mrtongxin"))
				.set("ai", function (target) {
					return 1 + get.attitude(player, target);
				})
				.forResult();
		},
		async content(event, trigger, player) {
			let targets = event.targets;
			player.storage.mrtongxin = targets;
			game.log(player, "选择了", targets, "为【同心】目标");
			for (var p of targets) player.storage.mrtongxin_p.push(0);
		},
		mark: true,
		marktext: "心",
		intro: {
			name: "同心",
			content(storage, player, skill) {
				if (player.storage.mrtongxin.length == 0) return "<li>暂未选择【同心】目标";
				let targets = player.storage.mrtongxin,
					num = targets.length,
					str = "<li>你已选择",
					str2 = "";
				for (var i = 0; i < num; i++) {
					str2 += "<br><li>" + get.translation(targets[i]) + "：" + Math.min(30 + 5 * player.storage.mrtongxin_p[i], 100) + "%";
					str += get.translation(targets[i]);
					if (i != num - 1) str += "、";
				}
				str += "为【同心】目标，触发概率如下";
				return str + str2;
			},
			markcount(storage, player) {
				return player.storage.mrtongxin.length;
			},
		},
		ai: {
			maixie: true,
			maixie_hp: true,
		},
		group: "mrtongxin_effect",
		subSkill: {
			effect: {
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					global: "damageAfter",
				},
				filter: function (event, player) {
					return player.storage.mrtongxin.includes(event.player);
				},
				async content(event, trigger, player) {
					let result = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].randomGet(),
						index = player.storage.mrtongxin.indexOf(trigger.player);
					if (result <= 6 + player.storage.mrtongxin_p[index]) {
						game.log(trigger.player, "成功发动了", "#g【同心】");
						trigger.player.recover();
						if (player.storage.mrtongxin_p[index] < 14) player.storage.mrtongxin_p[index]++;
					} else game.log(trigger.player, "发动", "#g【同心】", "失败");
				},
			},
		},
	},
	mrqianjin: {
		locked: true,
		trigger: {
			player: "phaseUseBegin",
		},
		init: function (player) {
			player.storage.mrqianjin = 2;
		},
		async content(event, trigger, player) {
			await player.draw(player.storage.mrqianjin);
			if (player.storage.mrqianjin < 5) player.storage.mrqianjin++;
			await player.addTempSkill("mrqianjin_effect", { player: "phaseBeginStart" });
		},
		prompt2: function (event, player) {
			return "出牌阶段开始时，你可以摸" + player.storage.mrqianjin + "张牌，若如此做，直到你的下回合开始，你的【闪】均视为【杀】";
		},
		group: "mrqianjin_use",
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == "sha") {
					let history = player.getHistory("useCard", evt => {
						return evt.card.name == "sha" && evt.isPhaseUsing();
					});
					let l = history.length;
					if (l) {
						let number = get.number(history[l - 1].card);
						if (number == null || get.number(card) >= number) return Infinity;
					}
				}
			},
		},
		subSkill: {
			effect: {
				mod: {
					cardname: function (card, player, name) {
						if (card.name == "shan") return "sha";
					},
				},
			},
			use: {
				locked: true,
				usable: 1,
				trigger: {
					player: "useCardToPlayered",
				},
				filter(event, player) {
					return event.card && event.card.name == "sha" && get.color(event.card) == "red" && event.target.countGainableCards(player, "hej") > 0;
				},
				async content(event, trigger, player) {
					player.gainPlayerCard(trigger.target, true, "hej");
				},
				prompt2: function (event, player) {
					return "获得" + get.translation(event.target) + "区域内的一张牌";
				},
			},
		},
	},
	mrjieti: {
		forced: true,
		locked: true,
		trigger: {
			player: "useCard",
			source: "damageSource",
		},
		init: function (player) {
			player.storage.mrjieti = 1;
		},
		filter: function (event, player) {
			if (event.name == "damage" && player.storage.mrjieti == 4) return true;
			let types = ["", "basic", "trick", "equip", ""];
			if (event.name == "useCard" && event.card && get.type(event.card) == types[player.storage.mrjieti]) return true;
		},
		async content(event, trigger, player) {
			if (player.storage.mrjieti == 4) {
				let list = [];
				while (list.length < 3) {
					let card = get.cardPile(function (card) {
						return !list.includes(get.type(card, "trick")) && !list.includes(card);
					});
					if (card) list.push(card);
					else break;
				}
				await player.gain(list, "gain2", "log");
				player.storage.mrjieti = 1;
				game.log(player, "完成了阶梯计划");
			} else player.storage.mrjieti++;
			game.addVideo("storage", player, ["mrjieti", player.storage.mrjieti]);
		},
		mark: true,
		marktext: "阶",
		intro: {
			name: "阶梯计划",
			content(storage, player, skill) {
				let str = ["", "<li>使用基本牌...", "<br><li>使用锦囊牌...", "<br><li>使用装备牌...", "<br><li>造成伤害.....", "<br><li>阶梯计划完成奖励：从牌堆中获得三种类型不同的牌各一张"],
					str1 = "";
				for (var i = 1; i < 5; i++) {
					str1 += str[i];
					if (player.storage.mrjieti > i) str1 += "已完成";
					else str1 += "未完成";
				}
				str1 += str[5];
				return str1;
			},
			markcount(storage, player) {
				return player.storage.mrjieti - 1 + "/" + 4;
			},
		},
	},
	mrxiehu: {
		forced: true,
		locked: true,
		trigger: {
			player: "phaseBegin",
		},
		async content(event, trigger, player) {
			player.loseHp();
		},
		group: "mrxiehu_effect",
		subSkill: {
			effect: {
				forced: true,
				locked: true,
				trigger: {
					player: "phaseEnd",
				},
				async content(event, trigger, player) {
					let players = game.players.sortBySeat(player);
					if (players.length > 1) {
						await player.removeSkill("mrxiehu");
						await players[1].addSkill("mrxiehu");
					}
				},
			},
		},
	},
	mrxingxun: {
		forced: true,
		locked: true,
		derivation: "mrxiehu",
		init: function (player) {
			player.storage.mrxingxun = [];
		},
		trigger: {
			player: "phaseUseBegin",
		},
		filter: function (event, player) {
			return player.isDamaged();
		},
		async content(event, trigger, player) {
			let num = player.maxHp - player.hp;
			let list = [];
			while (num) {
				let card = get.cardPile(function (card) {
					return card.name == "sha" && !list.includes(card);
				});
				if (card) {
					card.addGaintag("mrxingxun");
					list.push(card);
					num--;
				} else break;
			}
			if (list) await player.gain(list, "gain2", "log");
			player
				.when("phaseUseEnd")
				.filter(() => {
					return player.countCards("h", card => card.hasGaintag("mrxingxun"));
				})
				.then(() => {
					let cards = player.getCards("h", card => card.hasGaintag("mrxingxun"));
					player.discard(cards);
				});
		},
		mod: {
			targetInRange: function (card, player) {
				if (get.color(card) == "black" && card.cards.length == 1 && card.cards[0].hasGaintag("mrxingxun")) return true;
			},
		},
		intro: {
			content: "已使用颜色：$",
			onunmark: true,
		},
		group: ["mrxingxun_use", "mrxingxun_effect", "mrxingxun_clear", "mrxingxun_draw"],
		subSkill: {
			use: {
				forced: true,
				locked: true,
				charlotte: true,
				popup: false,
				silent: true,
				firstDo: true,
				trigger: {
					player: "useCard1",
				},
				filter(event, player) {
					return event.card && event.card.name == "sha" && event.addCount !== false && !player.storage.mrxingxun.includes(get.color(event.card));
				},
				async content(event, trigger, player) {
					let colors = ["black", "red", "none"];
					player.markAuto("mrxingxun", [get.color(trigger.card)]);
					player.storage.mrxingxun.sort((a, b) => colors.indexOf(a) - colors.indexOf(b));
					player.addTip("mrxingxun", get.translation("mrxingxun") + player.getStorage("mrxingxun").reduce((str, color) => str + get.translation(color), ""));
					trigger.addCount = false;
					if (player.stat[player.stat.length - 1].card.sha > 0) {
						player.stat[player.stat.length - 1].card.sha--;
					}
				},
			},
			clear: {
				forced: true,
				locked: true,
				charlotte: true,
				popup: false,
				silent: true,
				firstDo: true,
				trigger: {
					player: "phaseEnd",
				},
				filter(event, player) {
					return player.storage.mrxingxun.length;
				},
				async content(event, trigger, player) {
					player.unmarkSkill("mrxingxun");
					player.removeTip("mrxingxun");
					player.storage.mrxingxun = [];
				},
			},
			effect: {
				forced: true,
				locked: true,
				charlotte: true,
				popup: false,
				silent: true,
				firstDo: true,
				trigger: {
					player: "useCard1",
				},
				filter(event, player) {
					return event.card && event.card.name == "sha" && event.cards && event.cards.length == 1 && get.color(event.card) != "none" && player.hasHistory("lose", evtx => (evtx.relatedEvent || evtx.getParent()) === event && Object.keys(evtx.gaintag_map).some(i => evtx.gaintag_map[i].includes("mrxingxun")));
				},
				async content(event, trigger, player) {
					if (get.color(trigger.card) == "red") trigger.baseDamage++;
					else if (get.color(trigger.card) == "black") {
						trigger.directHit.addArray(
							game.filterPlayer(function (current) {
								return current != player;
							})
						);
					}
				},
			},
			draw: {
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					global: "die",
				},
				filter: function (event, player) {
					return event.reason && event.reason.getParent().name == "mrxiehu";
				},
				async content(event, trigger, player) {
					let list = [],
						num = 3;
					while (num) {
						let card = get.cardPile(function (card) {
							return card.name == "sha" && !list.includes(card);
						});
						if (card) {
							list.push(card);
							num--;
						} else break;
					}
					if (list) await player.gain(list, "gain2", "log");
					player.addSkill("mrxingxun_phaseUse");
					player.addMark("mrxingxun_phaseUse");
				},
			},
			phaseUse: {
				forced: true,
				locked: true,
				charlotte: true,
				silent: true,
				popup: false,
				trigger: {
					player: "phaseUseEnd",
				},
				marktext: "邪",
				intro: {
					content: "下个出牌阶段使用杀的次数+3，并在该阶段结束后令按座次顺序的下一名角色获得【邪乎】",
				},
				async content(event, trigger, player) {
					let players = game.players.sortBySeat(player);
					if (players.length == 1) await player.addSkill("mrxiehu");
					else if (players.length > 1) await players[1].addSkill("mrxiehu");
					player.removeSkill("mrxingxun_phaseUse");
				},
				mod: {
					cardUsable: function (card, player, num) {
						if (card.name == "sha") return num + 3;
					},
				},
			},
		},
	},
	mrdongmian: {
		limited: true,
		skillAnimation: true,
		animationColor: "thunder",
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => (player.storage[skill] = false),
		trigger: {
			player: "dying",
		},
		async content(event, trigger, player) {
			player.awakenSkill("mrdongmian");
			await player.removeSkill("mrxingxun");
			await game.countPlayer(p => {
				if (p.hasSkill("mrxiehu")) p.removeSkill("mrxiehu");
			});
			await player.gainMaxHp();
			await player.recoverTo(player.maxHp);
			player.out("mrdongmian");
			player.addSkill("mrdongmian_return");
		},
		ai: {
			save: true,
		},
		derivation: "mrbaohu",
		subSkill: {
			return: {
				trigger: {
					player: "phaseBefore",
				},
				forced: true,
				charlotte: true,
				silent: true,
				forceDie: true,
				forceOut: true,
				popup: false,
				filter(event, player) {
					return event.player.isOut();
				},
				async content(event, trigger, player) {
					player.in("mrdongmian");
					player.addSkill("mrbaohu");
					player.removeSkill("mrdongmian_return");
				},
			},
		},
	},
	mrbaohu: {
		forced: true,
		charlotte: true,
		trigger: {
			player: ["recoverBefore", "damageBefore"],
		},
		filter: function (event, player) {
			if (event.name == "damage") return player.isDamaged();
			return true;
		},
		async content(event, trigger, player) {
			trigger.cancel();
			if (event.triggername == "damageBefore") await player.loseMaxHp();
		},
		group: ["mrbaohu_draw", "mrbaohu_live"],
		subSkill: {
			draw: {
				trigger: {
					global: "damageEnd",
				},
				check: function (event, player) {
					return 1 + get.attitude(player, event.player);
				},
				filter: function (event, player) {
					return event.player != player && event.player.isIn();
				},
				async content(event, trigger, player) {
					await trigger.player.draw(2);
					await player.damage();
				},
			},
			live: {
				trigger: {
					global: "damageBefore",
				},
				check: function (event, player) {
					return 1 + get.attitude(player, event.player);
				},
				filter: function (event, player) {
					return event.player != player && event.num >= event.player.hp && event.player.isIn();
				},
				async content(event, trigger, player) {
					await trigger.cancel();
					await player.damage();
				},
			},
		},
	},
	mrshanyuan: {
		trigger: {
			global: "recoverAfter",
		},
		async content(event, trigger, player) {
			await player.draw("nodelay");
			await trigger.player.draw("nodelay");
			if (player.isPhaseUsing()) await player.draw();
		},
	},
	mrqiyuan: {
		groupSkill: "nong",
		enable: "phaseUse",
		usable: 1,
		targetprompt: ["回复体力", "失去体力"],
		filter(event, player) {
			return game.countPlayer() > 1 && player.group == "nong";
		},
		filterTarget: true,
		selectTarget: 2,
		multitarget: true,
		async content(event, trigger, player) {
			let target1 = event.targets[0],
				target2 = event.targets[1];
			await target1.recover();
			await target2.loseHp();
		},
		ai: {
			order: 8,
			result: {
				target(player, target) {
					if (ui.selected.targets.length == 0) {
						return 2;
					} else {
						return -2;
					}
				},
			},
			expose: 0.6,
			threaten: 2,
		},
		group: ["mrqiyuan_use"],
		subSkill: {
			use: {
				forced: true,
				locked: false,
				popup: false,
				trigger: {
					global: "loseHpAfter",
				},
				filter: function (event, player) {
					return player.group == "nong" && player.isPhaseUsing();
				},
				async content(event, trigger, player) {
					player.addTempSkill("mrqiyuan_inf", "phaseUseAfter");
					player.markAuto("mrqiyuan_inf", [trigger.player]);
				},
			},
			inf: {
				charlotte: true,
				onremove: true,
				forced: true,
				intro: {
					content: "对$使用牌无次数限制",
				},
				mod: {
					cardUsableTarget(card, player, target) {
						if (player.getStorage("mrqiyuan_inf").includes(target)) {
							return true;
						}
					},
				},
			},
		},
	},
	mrjieyuan: {
		groupSkill: "yys",
		enable: "phaseUse",
		usable: 1,
		filter: function (event, player) {
			return player.hasEnabledSlot() && player.group == "yys";
		},
		async content(event, trigger, player) {
			const result = await player.chooseToDisable().forResult();
			await player.gainMaxHp();
			await player.recover();
		},
		mod: {
			globalTo(from, to, distance) {
				if (to.group != "yys") return;
				let num = 0;
				for (let i = 1; i <= 5; i++) if (to.hasDisabledSlot(i)) num++;
				return distance + num;
			},
		},
		group: ["mrjieyuan_re"],
		subSkill: {
			re: {
				forced: true,
				locked: true,
				trigger: {
					player: "dying",
				},
				filter: function (event, player) {
					return player.hasDisabledSlot() && player.group == "yys";
				},
				async content(event, trigger, player) {
					let num = 0;
					for (let i = 1; i <= 5; i++)
						if (player.hasDisabledSlot(i)) {
							await player.enableEquip(i);
							num++;
						}
					player.loseMaxHp(num);
				},
			},
		},
	},
	mrtuiyou: {
		forced: true,
		locked: true,
		trigger: {
			source: "die",
		},
		async content(event, trigger, player) {
			if (player.group == "yys") {
				await player.changeGroup("nong");
				player.changeSkin({ characterName: "mr_shaosiyuan" }, "mr_shaosiyuan_nong");
			} else {
				await player.changeGroup("yys");
				player.changeSkin({ characterName: "mr_shaosiyuan" }, "mr_shaosiyuan_yys");
			}
		},
	},
	mrxinnian: {
		dutySkill: true,
		forced: true,
		locked: true,
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		filter(event, player) {
			if (player.countCards("h")) {
				return false;
			}
			var num = Array.from({ length: 5 })
				.map((_, i) => i + 1)
				.reduce((sum, i) => sum + player.countEmptySlot(i), 0);
			if (!num) return false;
			const evt = event.getl(player);
			return evt && evt.player == player && evt.hs && evt.hs.length > 0;
		},
		async content(event, trigger, player) {
			var num = Array.from({ length: 5 })
				.map((_, i) => i + 1)
				.reduce((sum, i) => sum + player.countEmptySlot(i), 0);
			await player.draw(num);
		},
		intro: {
			content: "已记录花色：$",
			onunmark: true,
		},
		derivation: ["mrtaoli", "mrxingfa"],
		group: ["mrxinnian_count", "mrxinnian_phase", "mrxinnian_achieve", "mrxinnian_fail"],
		subSkill: {
			count: {
				trigger: {
					player: "useCard",
				},
				forced: true,
				locked: true,
				popup: false,
				filter(event, player, name) {
					if (_status.currentPhase != player) return false;
					const suit = get.suit(event.card);
					if (!lib.suit.includes(suit)) {
						return false;
					}
					if (player.storage.mrxinnian?.includes(suit)) {
						return false;
					}
					return true;
				},
				content() {
					player.markAuto("mrxinnian", [get.suit(trigger.card)]);
					player.storage.mrxinnian.sort((a, b) => lib.suit.indexOf(b) - lib.suit.indexOf(a));
					player.addTip("mrxinnian", get.translation("mrxinnian") + player.getStorage("mrxinnian").reduce((str, suit) => str + get.translation(suit), ""));
				},
			},
			phase: {
				forced: true,
				locked: true,
				trigger: {
					player: "phaseEnd",
				},
				init: function (player) {
					player.storage.mrxinnian_count = 0;
				},
				filter: function (event, player) {
					return player.storage.mrxinnian?.length;
				},
				async content(event, trigger, player) {
					let num = player.storage.mrxinnian.length;
					await player.unmarkSkill("mrxinnian");
					await player.removeTip("mrxinnian");
					if (num >= 2 && player.getDiscardableCards("h").length) {
						let bool = await player.chooseToDiscard(1, "h", "是否选择重铸一张手牌").forResultBool();
						if (bool) await player.draw();
					}
					if (num >= 3 && player.getDiscardableCards("he").length) {
						let result = await player.chooseToDiscard([1, 3], "he", "弃置至多3张牌，并对至多等量角色各造成1点伤害").forResult();
						if (result.bool) {
							let numm = result.cards.length;
							let result2 = await player.chooseTarget([1, numm], "对至多" + numm + "名角色各造成1点伤害").forResult();
							if (result2.bool) {
								let targets = result2.targets;
								for (var t of targets) t.damage(player);
							}
						}
					}
					if (num >= 4) {
						player.insertPhase("mrxinnian");
						player.storage.mrxinnian_count++;
					}
				},
			},
			achieve: {
				trigger: {
					global: "phaseBegin",
				},
				forced: true,
				skillAnimation: true,
				animationColor: "fire",
				filter: function (event, player) {
					return player.storage.mrxinnian_count == 3;
				},
				async content(event, trigger, player) {
					game.log(player, "成功完成使命");
					player.awakenSkill("mrxinnian");
					let num = 0;
					for (var i = 1; i <= 5; i++) {
						if (player.hasEmptySlot(i)) {
							let card = get.cardPile(card => get.subtype(card) == "equip" + i);
							if (card) await player.chooseUseTarget(card, true, "nopopup");
						} else num++;
					}
					await player.draw(num);
				},
			},
			fail: {
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					player: "dying",
				},
				async content(event, trigger, player) {
					game.log(player, "使命失败");
					player.awakenSkill("mrxinnian");
					await player.discard(player.getCards("hej"));
					await player.recoverTo(player.maxHp);
					await player.drawTo(player.maxHp);
					await player.addSkill("mrxingfa");
				},
			},
		},
	},
	mrtaoli: {
		forced: true,
		locked: true,
		init: function (player) {
			player.storage.mrtaoli = player.maxHp;
		},
		trigger: {
			player: "damageEnd",
		},
		async content(event, trigger, player) {
			await player.draw(player.storage.mrtaoli);
			player.storage.mrtaoli--;
			if (player.storage.mrtaoli == 0) player.storage.mrtaoli = player.maxHp;
		},
		mod: {
			globalTo(from, to, distance) {
				return to.storage.mrtaoli + distance;
			},
		},
		group: ["mrtaoli_choose"],
		subSkill: {
			choose: {
				forced: true,
				locked: true,
				trigger: {
					player: "phaseBegin",
				},
				async content(event, trigger, player) {
					const list = [];
					list.push("选项一");
					list.push("选项二");
					const control = await player
						.chooseControl(list)
						.set("choiceList", ["受到1点伤害并增加一点体力上限(不超过6)。", "随机弃置一张可弃置的装备区的牌并摸花色与你装备区里的牌均不同的牌各一张。"])
						.set("prompt", get.prompt("mrtaoli"))
						.set("ai", () => {
							if (player.maxHp >= 6 && player.hp > 1) return "选项二";
							else return "选项一";
						})
						.forResultControl();
					if (control == "选项一") {
						await player.damage();
						if (player.maxHp < 6) await player.gainMaxHp();
					} else if (control == "选项二") {
						let cards = player.getDiscardableCards(player, "e"),
							suits = [],
							list = [];
						if (cards.length) {
							let card = cards.randomGet();
							await player.discard(card);
							suits.add(get.suit(card));
						}
						while (suits.length <= 5) {
							let cc = get.cardPile2(c => !suits.includes(get.suit(c)));
							if (cc) {
								list.push(cc);
								suits.push(get.suit(cc));
							} else break;
						}
						await player.gain(list, "gain2", "log");
					}
				},
			},
		},
	},
	mrxingfa: {
		forced: true,
		locked: true,
		trigger: {
			player: "damageEnd",
		},
		filter(event, player) {
			return event.source && event.num > 0 && event.source != player;
		},
		content: function () {
			var target = trigger.source;
			target.loseHp();
		},
	},
	mryinxian: {
		actionSkill: true,
		forced: true,
		locked: true,
		init: function (player, skill) {
			if (typeof player.storage.xingdongtiao === "undefined") player.storage.xingdongtiao = 0;
			if (typeof player.storage.mryinxian_used === "undefined") player.storage.mryinxian_used = [];
			player.storage.mryinxian_phaseused = [];
			if (typeof player.xingdongtiao === "undefined")
				player.xingdongtiao = {
					Skip: ["gameStart", "useCardBegin", "gainBegin", "phaseBeginStart", "damageBegin"],
					Name: "行动条",
					Color: "#DC143C",
					Max: 100,
					Np: 0,
				};
		},
		trigger: {
			player: "phaseBegin",
		},
		derivation: ["mrguli"],
		yinlv: ["宫·赤之霞：你可以对一名角色造成1点伤害并令其获得【孤立】至其下个回合结束。", "商·山吹：你可以选择至多三名角色，然后视为对其使用【杀】（无距离限制）。", "角·神宫华辉：使本回合下次造成的伤害+1，摸一张牌然后增加20%行动条。", "徵·薰风：摸一张牌并回复1点体力，若你没有损失体力，则你额外摸两张牌。", "羽·澈：清除负面效果并增加20%行动条，获得一名其他角色的一张牌。"],
		yinlveffect() {
			"step 0";
			if (num == 1) event.goto(3);
			else if (num >= 2) event.goto(num + 3);
			("step 1");
			player.chooseTarget(1, "宫·赤之霞：你可以对一名角色造成1点伤害并令其获得【孤立】至其下个回合结束。").set("ai", target => 1 - get.attitude(player, target));
			("step 2");
			if (result.bool) {
				result.targets[0].damage(player);
				result.targets[0].addTempSkill("mrguli");
			}
			event.goto(9);
			("step 3");
			let card = { name: "sha", isCard: true };
			player
				.chooseTarget([1, 3], "商·山吹：你可以选择至多三名角色，然后视为对其使用【杀】(无距离限制)。", function (ccard, player, target) {
					return player.canUse(card, target, false);
				})
				.set("ai", target => player.canUse(card, target, false) && get.effect(target, card, player, player));

			("step 4");
			if (result.bool) for (var p of result.targets) player.useCard({ name: "sha", isCard: true }, p);
			event.goto(9);
			("step 5");
			player.addTempSkill("mryinxian_damage");
			player.draw();
			lib.skill._mrxingdongtiao.changeNp(20, "因“角”音律");
			event.goto(9);
			("step 6");
			player.draw();
			if (!player.isDamaged()) player.draw(2);
			else player.recover();
			event.goto(9);
			("step 7");
			let next2 = game.createEvent("mryinxian_yu");
			next2.player = player;
			next2.setContent(lib.skill.mrjinghua.contentx);
			lib.skill._mrxingdongtiao.changeNp(20, "因“羽”音律");
			player
				.chooseTarget(1, "羽·澈：清除负面效果并增加20%行动条，获得一名其他角色的一张牌。", function (card, player, target) {
					return player != target;
				})
				.set("ai", target => 1 - get.attitude(player, target));
			("step 8");
			if (result.bool) player.gainPlayerCard(result.targets[0], 1, "he", true);
			("step 9");
		},
		async content(event, trigger, player) {
			const list = [],
				index = [],
				chList = lib.skill.mryinxian.yinlv.randomGets(2),
				index1 = lib.skill.mryinxian.yinlv.indexOf(chList[0]),
				index2 = lib.skill.mryinxian.yinlv.indexOf(chList[1]);
			list.push("选项一");
			list.push("选项二");
			list.push("背水！");
			chList.push("背水！音律视为未使用过并执行上述所有选项");
			const control = await player
				.chooseControl(list)
				.set("choiceList", chList)
				.set("prompt", get.prompt("mryinxian"))
				.set("ai", () => {
					if (player.storage.mryinxian_used.includes(chList[0]) && player.storage.mryinxian_used.includes(chList[1])) return "背水！";
					else if (player.storage.mryinxian_used.includes(chList[0])) return "选项二";
					else return "选项一";
				})
				.forResultControl();
			if (["选项一", "背水！"].includes(control)) index.push(index1);
			if (["选项二", "背水！"].includes(control)) index.push(index2);
			for (var i of index) {
				let nextt = game.createEvent("mryinxian_effect");
				nextt.setContent(lib.skill.mryinxian.yinlveffect);
				nextt.num = i;
				nextt.player = player;
				await nextt;
			}
			await lib.skill._mrxingdongtiao.changeNp(10);
			if (index.length == 1) {
				player.storage.mryinxian_used.add(index[0]);
				player.storage.mryinxian_phaseused = [index[0]];
				await player.addTempSkill("mryinxian_use");
				await player.addMark("mryinxian_use", 1, false);
			}
		},
		mark: true,
		marktext: "音",
		intro: {
			content: function (storage, player, skill) {
				let yinlv = ["宫", "商", "角", "徵", "羽"],
					result = [],
					str = "当前已演奏的音律：";
				if (!player.storage.mryinxian_used.length) return "当前暂未演奏音律";
				for (var i = 0; i < 5; i++) if (player.storage.mryinxian_used.includes(i)) result.push(yinlv[i]);
				return str + result;
			},
			markcount: function (storage, player) {
				return player.storage.mryinxian_used.length + "/5";
			},
		},
		group: ["mrxingdongtiao"],
		subSkill: {
			damage: {
				forced: true,
				locked: true,
				trigger: {
					source: "damageBegin1",
				},
				async content(event, trigger, player) {
					trigger.num++;
					await player.removeSkill("mryinxian_damage");
				},
			},
			use: {
				forced: true,
				locked: true,
				onremove: function (player, skill) {
					player.storage.mryinxian_phaseused = [];
				},
				trigger: {
					player: "useCard",
				},
				filter: function (event, player) {
					return event.card && (event.card.name == "sha" || (get.type(event.card) == "trick" && get.tag(event.card, "damage") > 0)) && event.getParent().name != "mryinxian_effect" && player.storage.mryinxian_phaseused.length;
				},
				async content(event, trigger, player) {
					let i = player.storage.mryinxian_phaseused[0];
					let nextt = game.createEvent("mryinxian_effect");
					nextt.setContent(lib.skill.mryinxian.yinlveffect);
					nextt.num = i;
					nextt.player = player;
					await nextt;
				},
				marktext: "弦",
				intro: {
					content: function (storage, player, skill) {
						let yinlv = ["宫", "商", "角", "徵", "羽"];
						return "<li>本回合已演奏的音律:" + yinlv[player.storage.mryinxian_phaseused[0]] + "<br><li>使用【杀】或伤害性锦囊牌时将附带该音律";
					},
					markcount() {
						return 0;
					},
				},
			},
		},
	},
	mrlvqi: {
		unique: true,
		limited: true,
		mark: true,
		intro: {
			content: "limited",
		},
		skillAnimation: true,
		animationColor: "wood",
		init: function (player) {
			//初始化
			player.storage.mrlvqi = false; //技能未发动(xx为技能名)
			if (typeof player.storage.mryinxian_used === "undefined") player.storage.mryinxian_used = [];
		},
		filter: function (event, player) {
			//发动限制条件
			return player.storage.mrlvqi == false; //你没发动过这个技能
		},
		enable: "phaseUse",
		filterTarget: function (card, player, target) {
			return player.canUse({ name: "sha", isCard: true }, target, false);
		},
		filterCard: () => false,
		selectCard: -1,
		async content(event, trigger, player) {
			player.storage.mrlvqi = true; //技能发动过
			await player.awakenSkill("mrlvqi");
			let target = event.targets[0],
				card1 = { name: "sha", isCard: true },
				card3 = { name: "sha", isCard: true, nature: "fire" },
				card2 = { name: "sha", isCard: true, nature: "thunder" };
			if (target.isIn()) await player.useCard(card1, target);
			if (target.isIn()) await player.useCard(card2, target);
			if (target.isIn()) await player.useCard(card2, target);
			if (player.storage.mryinxian_used.length) {
				for (var i of player.storage.mryinxian_used) {
					let nextt = game.createEvent("mryinxian_effect");
					nextt.setContent(lib.skill.mryinxian.yinlveffect);
					nextt.num = i;
					nextt.player = player;
					await nextt;
				}
			}
		},
		_priority: 0,
	},
	mrqingyu: {
		forced: true,
		locked: true,
		popup: false,
		trigger: {
			source: "damageEnd",
			global: "recoverEnd",
		},
		init: function (player) {
			player.storage.mrqingyu = 0;
		},
		async content(event, trigger, player) {
			player.storage.mrqingyu = Math.min(player.maxHp + 3, player.storage.mrqingyu + trigger.num);
			player.update();
		},
		mark: true,
		marktext: "晴",
		intro: {
			name: "日光能量",
			content: "当前共有#点日光能量",
			markcount: function (storage, player) {
				return player.storage.mrqingyu + "/" + (player.maxHp + 3);
			},
			onunmark: true,
		},
		group: ["mrqingyu_recover"],
		subSkill: {
			recover: {
				trigger: {
					global: "phaseEnd",
				},
				filter: function (event, player) {
					return game.countPlayer(p => p.isMinHp() && p.isDamaged()) && player.storage.mrqingyu > 1;
				},
				async cost(event, trigger, player) {
					let players = game.filterPlayer(p => p.isMinHp() && p.isDamaged());
					event.result = await player
						.chooseTarget(1, "是否消耗2点“日光能量”令一名体力值最少的角色回复1点体力", function (card, player, target) {
							return players.includes(target);
						})
						.set("ai", target => 1 + get.attitude(player, target) * ((target.maxHp - target.hp) / 2))
						.forResult();
				},
				async content(event, trigger, player) {
					let target = event.targets[0];
					let num = Math.min(Math.ceil(target.maxHp - target.hp), Math.floor(player.storage.mrqingyu / 2));
					player.storage.mrqingyu -= 2 * num;
					await target.recover(num);
				},
			},
		},
	},
	mrziyang: {
		trigger: {
			global: "dying",
		},
		check: function (event, player) {
			return get.attitude(player, event.player);
		},
		init: function (player) {
			if (typeof player.storage.mrqingyu === "undefined") player.storage.mrqingyu = 0;
		},
		filter: function (event, player) {
			let bool = 1;
			for (var i in player.disabledSkills) if (player.disabledSkills[i].includes("mrqingyu")) bool = 0;
			return player.hasSkill("mrqingyu") && bool;
		},
		async content(event, trigger, player) {
			let target = trigger.player;
			player.logSkill("mrziyang", target);
			await target.recoverTo(1);
			if (player.storage.mrqingyu == 1) player.storage.mrqingyu = 0;
			while (player.storage.mrqingyu) {
				player.storage.mrqingyu -= 2;
				if (player.hp <= target.hp && player.isDamaged()) await player.recover();
				else await target.recover();
				if (player.storage.mrqingyu == 1) player.storage.mrqingyu = 0;
			}
			await player.disableSkill("mrziyang_ban", "mrqingyu");
			await player.unmarkSkill("mrqingyu");
			await player.addSkill("mrziyang_ban");
		},
		group: ["mrziyang_draw"],
		subSkill: {
			draw: {
				forced: true,
				locked: true,
				trigger: {
					player: "phaseDrawBegin2",
				},
				filter(event, player) {
					let bool = 0;
					for (var i in player.disabledSkills) if (player.disabledSkills[i].includes("mrziyang_ban")) bool = 1;
					return !event.numFixed && bool;
				},
				async content(event, trigger, player) {
					trigger.num += 2;
				},
			},
			ban: {
				onremove(player, skill) {
					player.enableSkill(skill);
					player.storage.mrqingyu = 0;
				},
				init: function (player) {
					player.storage.mrziyang_count = 0;
				},
				locked: true,
				forced: true,
				mark: true,
				charlotte: true,
				lastDo: true,
				trigger: {
					player: "phaseEnd",
				},
				filter: function (event, player) {
					player.storage.mrziyang_count++;
					player.update();
					return player.storage.mrziyang_count == 2;
				},
				async content(event, trigger, player) {
					await player.removeSkill("mrziyang_ban");
					await player.markSkill("mrqingyu");
				},
				intro: {
					content(storage, player, skill) {
						return "【晴雨】已失效，距离恢复还有" + (2 - player.storage.mrziyang_count) + "个回合";
					},
					markcount(storage, player) {
						return player.storage.mrziyang_count + "/2";
					},
				},
			},
		},
	},
	mrrenxin: {
		actionSkill: true,
		forced: true,
		locked: true,
		init: function (player, skill) {
			if (typeof player.storage.mrrenxin_yingqie === "undefined") player.storage.mrrenxin_yingqie = null;
			if (typeof player.storage.mrrenxin_count === "undefined") player.storage.mrrenxin_count = 0;
			if (typeof player.xingdongtiao === "undefined")
				player.xingdongtiao = {
					Skip: ["gameStart", "useCardBegin", "gainBegin", "phaseBeginStart", "damageBegin"],
					Name: "行动条",
					Color: "#DC143C",
					Max: 100,
					Np: 0,
				};
		},
		trigger: {
			global: "phaseEnd",
		},
		firstDo: true,
		filter: function (event, player) {
			return event.player != player;
		},
		async content(event, trigger, player) {
			lib.skill._mrxingdongtiao.changeNp(10, "因【韧心】自拉条");
		},
		mod: {
			targetEnabled(card, player, target) {
				if (get.type(card) == "delay" && player.storage.mrrenxin_yingqie) {
					return false;
				}
			},
		},
		ai: {
			noCompareTarget: false,
			skillTagFilter(player, tag, target) {
				if (player.storage.mrrenxin_yingqie && tag == "noCompareTarget") return true;
			},
		},
		group: ["mrrenxin_damage", "mrrenxin_turn", "mrrenxin_link", "mrrenxin_phaseuse", "mrrenxin_fresh", "mrrenxin_source", "mrrenxin_clear"],
		subSkill: {
			damage: {
				forced: true,
				locked: true,
				trigger: {
					player: "damageBegin1",
				},
				async content(event, trigger, player) {
					let result = await player.judge().forResult();
					if (result.suit == "heart" || (result.color == "red" && player.storage.mrrenxin_yingqie)) trigger.num--;
				},
			},
			turn: {
				locked: true,
				trigger: {
					player: "turnOverBefore",
				},
				filter(event, player) {
					return !player.isTurnedOver() && player.storage.mrrenxin_yingqie;
				},
				forced: true,
				content() {
					trigger.cancel();
				},
			},
			link: {
				locked: true,
				trigger: {
					player: "linkBegin",
				},
				forced: true,
				filter(event, player) {
					return !player.isLinked() && player.storage.mrrenxin_yingqie;
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
				ai: {
					noLink: true,
					effect: {
						target(card, player, target) {
							if (card.name == "tiesuo" && target.storage.mrrenxin) {
								return "zeroplayertarget";
							}
						},
					},
				},
			},
			phaseuse: {
				forced: false,
				locked: true,
				trigger: {
					player: "phaseUseBefore",
				},
				filter: function (event, player) {
					return !player.storage.mrrenxin_yingqie;
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseTarget(function (card, player, target) {
							return player != target;
						})
						.set("prompt2", "是否发动【韧心】：你可以跳过出牌阶段和弃牌阶段，选择一名其他角色成为“影切”，然后增加50%行动条")
						.set("ai", function (target) {
							return 1 - get.attitude(player, target);
						})
						.forResult();
				},
				async content(event, trigger, player) {
					trigger.cancel();
					player.skip("phaseDiscard");
					let target = event.targets[0];
					player.storage.mrrenxin_yingqie = target;
					player.addSkill("mrrenxin_yingqie");
					game.log(player, "将", target, "标记为", "#g“影切”");
					lib.skill._mrxingdongtiao.changeNp(60, "标记“影切”");
				},
			},
			yingqie: {
				charlotte: true,
				popup: false,
				onremove: function (player) {
					player.storage.mrrenxin_yingqie = null;
					player.storage.mrrenxin_count = 0;
					game.log(player, "已移除", "#g影切");
				},
				mark: "character",
				intro: {
					content: "你已选择$为“影切”",
				},
			},
			fresh: {
				forced: true,
				locked: true,
				charlotte: true,
				popup: false,
				trigger: {
					global: "dieAfter",
				},
				filter: function (event, player) {
					return event.player == player.storage.mrrenxin_yingqie;
				},
				async content(event, trigger, player) {
					player.storage.mrrenxin_yingqie = null;
					player.removeSkill("mrrenxin_yingqie");
				},
			},
			source: {
				forced: true,
				locked: true,
				trigger: {
					source: "damageEnd",
				},
				filter: function (event, player) {
					return event.getParent().name != "mrrenxin_source" && player.storage.mrrenxin_yingqie;
				},
				async content(event, trigger, player) {
					game.delay(0.5);
					player.storage.mrrenxin_yingqie.damage(player, trigger.num);
					player.storage.mrrenxin_count++;
					if (player.storage.mrrenxin_count == 3) player.removeSkill("mrrenxin_yingqie");
				},
			},
			clear: {
				forced: true,
				locked: true,
				trigger: {
					player: "damageBegin2",
				},
				filter: function (event, player) {
					return event.card && event.card.name == "sha" && event.source && event.source == player.storage.mrrenxin_yingqie;
				},
				async content(event, trigger, player) {
					player.removeSkill("mrrenxin_yingqie");
				},
			},
		},
	},
	mrduane: {
		actionSkill: true,
		locked: true,
		derivation: ["mrweiqie"],
		init: function (player, skill) {
			lib.skill.mrrenxin.init(player, skill);
		},
		trigger: {
			player: "phaseUseEnd",
		},
		filter: function (event, player) {
			let num = 3;
			if (player.storage.mrrenxin_yingqie) num = 1;
			return player.getCards("h").length >= num;
		},
		async cost(event, trigger, player) {
			let num = 3;
			if (player.storage.mrrenxin_yingqie) num = 1;
			event.result = await player
				.chooseCardTarget({
					filterCard(card, player) {
						return lib.filter.cardDiscardable(card, player);
					},
					filterTarget(card, player, target) {
						return player != target;
					},
					position: "he",
					selectCard: num,
					selectTarget: 1,
					prompt: "是否发动【断恶】",
					prompt2: "你可以弃置" + num + "张牌" + (num == 1 ? "并增加40%行动条," : ",") + "令一名其他角色获得【危切】至其回合结束，然后视为对其使用一张【杀】",
					ai1(card) {
						return 7 - get.value(card);
					},
					ai2(target) {
						var player = _status.event.player;
						return -get.attitude(player, target);
					},
				})
				.forResult();
		},
		async content(event, trigger, player) {
			let cards = event.cards,
				target = event.targets[0];
			await player.discard(cards);
			if (cards.length == 1) lib.skill._mrxingdongtiao.changeNp(40);
			await target.addTempSkill("mrweiqie", { player: "phaseAfter" });
			if (player.canUse({ name: "sha" }, target, false, false)) await player.useCard({ name: "sha" }, target);
		},
	},
	mryuhuo: {
		unique: true,
		actionSkill: true,
		limited: true,
		mark: true,
		intro: {
			content: "limited",
		},
		skillAnimation: true,
		animationColor: "fire",
		init: function (player, skill) {
			player.storage.mryuhuo = false;
			lib.skill.mrrenxin.init(player, skill);
		},
		trigger: {
			player: "dying",
		},
		filter: function (event, player) {
			return player.storage.mryuhuo == false; //你没发动过这个技能
		},
		async content(event, trigger, player) {
			(player.storage.mryuhuo = true), player.awakenSkill("mryuhuo");
			let num = Math.ceil(player.maxHp / 2);
			await player.recover(num);
			lib.skill._mrxingdongtiao.changeNp(50);
			await player.addTempSkill("mryuhuo_reduce", { player: "phaseBeginStart" });
			let evt = trigger.getParent();
			if (evt.name == "damage" && evt.source) {
				if (player.hasSkill("mrrenxin_yingqie")) await player.removeSkill("mrrenxin_yingqie");
				let target = evt.source;
				player.storage.mrrenxin_yingqie = target;
				await player.addSkill("mrrenxin_yingqie");
				game.log(player, "将", target, "标记为", "#g“影切”");
			}
		},
		subSkill: {
			reduce: {
				forced: true,
				locked: true,
				trigger: {
					player: "damageBegin1",
				},
				async content(event, trigger, player) {
					trigger.num--;
				},
			},
		},
	},
	mrweiqie: {
		forced: true,
		locked: true,
		mark: true,
		marktext: "危",
		intro: {
			name: "危",
			content(storage, player, skill) {
				let str = `<p align="center"><b>凌空起刀，似有鬼兵之影</b></p>` + "<li>锁定技。你的其他非锁定技失效。回合外你无法使用或打出手牌。你的手牌上限-1。";
				const list = player.getSkills(null, false, false).filter(function (i) {
					return lib.skill.mrweiqie.skillBlocker(i, player);
				});
				if (list.length) str += "<br><li>失效技能：" + get.translation(list);
				else str += "<br><li>无失效技能";
				return str;
			},
		},
		init(player, skill) {
			player.addSkillBlocker(skill);
			player.addTip(skill, "非锁定技失效");
		},
		onremove(player, skill) {
			player.removeSkillBlocker(skill);
			player.removeTip(skill);
		},
		skillBlocker(skill, player) {
			return skill != "mrweiqie" && !get.is.locked(skill, player) && !lib.skill[skill].charlotte && !lib.skill[skill].persevereSkill;
		},
		mod: {
			cardEnabled2(card, player, now) {
				if (get.position(card) == "h" && _status.currentPhase != player) {
					return false;
				}
			},
			maxHandcard: function (player, num) {
				return num - 1;
			},
		},
	},
	mryinxing: {
		audioname2: {
			mrmou_shaosiyuan: "ext:阴阳师/audio:2",
			mrmou_yuanjieshen: true,
		},
		trigger: {
			player: "phaseZhunbei",
		},
		filter: function (event, player) {
			return player.hasUseTarget("sha", false) || player.hasUseTarget("juedou", false);
		},
		async cost(event, trigger, player) {
			let cards = ["sha", "juedou"];
			let dialog = ui.create.dialog("是否发动【吟行】", "准备阶段，你可以视为使用一张【杀】或【决斗】", [cards, "vcard"]);
			const result = await player
				.chooseButtonTarget(dialog)
				.set("filterButton", button => player.hasUseTarget(button, false))
				.set("filterTarget", (card, player, target) => player.canUse(ui.selected.buttons[0], target, false))
				.set("ai1", function (button) {
					return player.getUseValue(button, false);
				})
				.set("ai2", function (target) {
					return get.effect(target, ui.selected.buttons[0], player, player);
				})
				.forResult();
			event.result = {
				bool: result.bool,
				targets: result.targets,
				cost_data: result.links,
			};
		},
		async content(event, trigger, player) {
			player.useCard({ name: event.cost_data[0][2] }, event.targets[0]);
		},
		ai: {
			threaten(player, target) {
				return 1.6;
			},
		},
		group: ["mryinxing_draw"],
		subSkill: {
			draw: {
				forced: true,
				trigger: {
					global: "damageEnd",
				},
				filter: function (event, player) {
					return event.getParent(3).name == "mryinxing";
				},
				async content(event, trigger, player) {
					player.draw(2);
				},
			},
		},
	},
	mryuanlai: {
		trigger: {
			source: "damageBegin",
			player: "damageBegin",
		},
		filter: function (event, player) {
			return event.player && event.source && event.player != event.source && event.card && (event.card.name == "sha" || (get.type(event.card) == "trick" && get.tag(event.card, "damage") > 0));
		},
		intro: {
			content: "expansion",
			markcount: "expansion",
		},
		marktext: "缘",
		derivation: ["mryuanli"],
		async cost(event, trigger, player) {
			let target = trigger.player == player ? trigger.source : trigger.player,
				bool = trigger.source == player ? 1 : 0;
			const list = [];
			list.push("选项一");
			list.push("选项二");
			list.push("选项三");
			list.push("背水！");
			list.push("cancel2");
			const control = await player
				.chooseControl(list)
				.set("choiceList", ["获得其一张牌", "将其一张牌置于你的武将牌上，称为“缘”", "弃置所有与此牌花色相同的“缘”，并令伤害增加/减少等量值(超出部分转换为两倍的摸牌)", "背水！伤害+1/-1"])
				.set("prompt", get.prompt("mryuanlai"))
				.set("ai", () => {
					if ((!player.hasSkill("mryuanli") && Math.random() >= 0.5) || get.attitude(player, target)) return "cancel2";
					let suit = get.suit(trigger.card),
						num1 = target.countGainableCards("he"),
						cards = player.getExpansions("mryuanlai"),
						num2 = cards.filter(c => get.suit(c) == suit).length;
					if (num1 >= 2 && num2 >= 2) return "背水！";
					else if ((bool && trigger.num + num2 >= target.hp) || (!bool && num2 > 0)) return "选项三";
					else if (Math.random() >= 0.5) return "选项二";
					else return "选项一";
				})
				.forResultControl();
			event.result = {
				bool: control != "cancel2",
				cost_data: control,
			};
		},
		async content(event, trigger, player) {
			let suit = get.suit(trigger.card),
				control = event.cost_data,
				target = trigger.player == player ? trigger.source : trigger.player,
				bool = trigger.source == player ? 1 : 0;
			if (control == "背水！") trigger.num -= 2 * bool - 1;
			if (["选项一", "背水！"].includes(control)) {
				await player.gainPlayerCard("he", target, true);
			}
			if (["选项二", "背水！"].includes(control) && target.countCards("he")) {
				let cards = await player.choosePlayerCard(target, "he", true).forResultCards();
				await player.addToExpansion(cards, target, "give").gaintag.add("mryuanlai");
			}
			if (["选项三", "背水！"].includes(control)) {
				let cards = player.getExpansions("mryuanlai").filter(c => get.suit(c) == suit);
				if (cards) await player.loseToDiscardpile(cards);
				trigger.num += (2 * bool - 1) * cards.length;
				if (trigger.num < 0) {
					await player.draw(2 * (0 - trigger.num));
					trigger.num = 0;
				}
			}
			if (player.getExpansions("mryuanlai").length == 7) {
				await player.gain(player.getExpansions("mryuanlai"), "gain2");
				if (!player.hasSkill("mryuanli")) await player.addSkill("mryuanli");
			}
		},
	},
	mryuanli: {
		forced: true,
		locked: true,
		trigger: {
			player: "phaseDrawBegin2",
		},
		filter(event, player) {
			let suits = [],
				cards = player.getExpansions("mryuanlai");
			for (var card of cards) if (!suits.includes(get.suit(card))) suits.add(get.suit(card));
			return !event.numFixed && suits.length >= 2;
		},
		async content(event, trigger, player) {
			trigger.num++;
		},
		mod: {
			maxHandcard: function (player, num) {
				return num + player.getExpansions("mryuanlai").length ? 1 : 0;
			},
			globalTo(from, to, distance) {
				let suits = [],
					cards = player.getExpansions("mryuanlai");
				for (var card of cards) if (!suits.includes(get.suit(card))) suits.add(get.suit(card));
				return suits.length >= 3 ? 1 : 0 + distance;
			},
		},
	},
	mrlingyuan: {
		forced: true,
		locked: true,
		audio: "ext:阴阳师/audio:12",
		logAudio: index => (typeof index === "number" ? "ext:阴阳师/audio/" + "mrlingyuan" + index + ".mp3" : "ext:阴阳师/audio:2"),
		trigger: {
			player: ["damageEnd", "recoverEnd"],
		},
		init: function (player, skill) {
			if (typeof player.storage.mrlingyuan === "undefined") player.storage.mrlingyuan = 0;
		},
		filter: function (event, player) {
			return event.source && event.source != player;
		},
		async content(event, trigger, player) {
			if (event.triggername == "damageEnd") trigger.source.addMark("mrlingyuan_nie");
			else trigger.source.addMark("mrlingyuan_shan");
		},
		marktext: "绩",
		mark: true,
		intro: {
			name: "司缘堂业绩",
			content: "你已累计#层业绩",
		},
		ai: {
			maixie_defend: true,
			effect: {
				target(card, player, target) {
					if (player.hasSkillTag("jueqing", false, target)) {
						return [1, -1];
					}
					return 0.5;
				},
			},
		},
		group: ["mrlingyuan_zhudong", "mrlingyuan_effect", "mrlingyuan_phase"],
		subSkill: {
			shan: {
				marktext: "善",
				intro: {
					name: "善缘",
					content: "你已被牵上善缘",
					markcount(storage, player) {
						return player.countMark("mrlingyuan_shan") + "/2";
					},
				},
			},
			nie: {
				marktext: "孽",
				intro: {
					name: "孽缘",
					content: "你已被牵上孽缘",
					markcount(storage, player) {
						return player.countMark("mrlingyuan_nie") + "/2";
					},
				},
			},
			zhudong: {
				enable: "phaseUse",
				usable: 2,
				filter: function (event, player) {
					return game.countPlayer(p => p != player);
				},
				filterTarget(card, player, target) {
					return target != player;
				},
				selectTarget: 1,
				prompt: "选择一名其他角色，令其获得“善缘”或“孽缘”",
				async content(event, trigger, player) {
					let target = event.target;
					const result = await player
						.chooseControl(["善缘", "孽缘"], true)
						.set("prompt", "请选择令" + get.translation(target) + "获得一层“善缘”或“孽缘”")
						.set("ai", () => {
							if (get.attitude(player, target) > 0) return "善缘";
							else return "孽缘";
						})
						.forResult();
					if (result.control == "善缘") {
						await target.addMark("mrlingyuan_shan");
						player.logSkill("mrlingyuan", target, null, null, [get.rand(5, 6)]);
					} else {
						await target.addMark("mrlingyuan_nie");
						player.logSkill("mrlingyuan", target, null, null, [get.rand(3, 4)]);
					}
				},
				ai: {
					order: 10,
					result: {
						target(player, target) {
							if (get.attitude(player, target) <= 0) {
								if (target.hasMark("mrlingyuan_nie")) return -4;
								return -2;
							} else if (get.attitude(player, target) > 0 && target.isDamaged()) {
								if (target.hasMark("mrlingyuan_shan")) return 2;
								return 1;
							}
						},
						player(player, target) {
							if (target.hasMark("mrlingyuan_shan") && get.attitude(player, target)) return 2;
							return 0;
						},
					},
					threaten: 2,
				},
			},
			effect: {
				forced: true,
				locked: true,
				trigger: {
					player: ["mrlingyuanAfter", "mrlingyuan_zhudongAfter"],
				},
				filter: function (event, player) {
					return game.countPlayer(p => p.countMark("mrlingyuan_shan") == 2 || p.countMark("mrlingyuan_nie") == 2);
				},
				async content(event, trigger, player) {
					game.countPlayer(p => {
						if (p.countMark("mrlingyuan_shan") == 2) {
							if (p.isDamaged()) player.recover();
							else player.draw(2, "nodelay");
							p.recover();
							p.removeMark("mrlingyuan_shan", 2);
							player.draw(2, "nodelay");
							player.storage.mrlingyuan++;
							player.update();
							player.logSkill("mrlingyuan", p, null, null, [get.rand(9, 10)]);
						}
						if (p.countMark("mrlingyuan_nie") == 2) {
							p.loseHp();
							if (p.countDiscardableCards("he")) p.chooseToDiscard(2, true, "he");
							else p.damage(player);
							p.removeMark("mrlingyuan_nie", 2);
							player.draw(2, "nodelay");
							player.storage.mrlingyuan++;
							player.update();
							player.logSkill("mrlingyuan", p, null, null, [get.rand(7, 8)]);
						}
					});
				},
			},
			phase: {
				forced: true,
				locked: true,
				trigger: {
					player: "phaseBegin",
				},
				filter: function (event, player) {
					return game.countPlayer(p => p.hasMark("mrlingyuan_shan") || p.hasMark("mrlingyuan_nie"));
				},
				async content(event, trigger, player) {
					game.countPlayer(p => {
						if (p.hasMark("mrlingyuan_shan")) p.draw("nodelay");
						if (p.hasMark("mrlingyuan_nie")) p.chooseToDiscard(1, true, "he");
					});
					player.logSkill("mrlingyuan", null, null, null, [get.rand(11, 12)]);
				},
			},
		},
	},
	mryinyuan: {
		audio: "ext:阴阳师/audio:3",
		logAudio: index => (typeof index === "number" ? "ext:阴阳师/audio/" + "mryinyuan" + index + ".mp3" : "ext:阴阳师/audio:2"),
		sunbenSkill: true,
		skillAnimation: true,
		animationStr: "因缘际会",
		animationColor: "fire",
		init: function (player, skill) {
			if (typeof player.storage.mrlingyuan === "undefined") player.storage.mrlingyuan = 0;
		},
		filter: function (event, player) {
			if (player.hasSkill("mryinyuan_sunben")) return false;
			return true;
		},
		filterCard(card, player) {
			return !ui.selected.cards.some(cardx => get.suit(cardx, player) == get.suit(card, player));
		},
		selectCard: 4,
		filterTarget: () => true,
		selectTarget() {
			return [1, _status.event.player.storage.mrlingyuan + 1];
		},
		multitarget: true,
		multiline: true,
		enable: "phaseUse",
		async content(event, trigger, player) {
			await player.addSkill("mryinyuan_sunben");
			const { targets } = event;
			for (const target of targets) {
				const result = await player
					.chooseControl(["回复1点体力", "失去1点体力"], true)
					.set("prompt", "请选择令" + get.translation(target) + "回复1点体力或失去1点体力")
					.set("ai", () => {
						if (get.attitude(player, target)) return "回复1点体力";
						else return "失去1点体力";
					})
					.forResult();
				if (result.control == "回复1点体力") await target.recover();
				else await target.loseHp();
			}
			player.storage.mrlingyuan = 0;
			await player.changeSkin({ characterName: "mrmou_shaosiyuan" }, "mrmou_shaosiyuan_zhanbai");
			await player.update();
		},
		subSkill: {
			sunben: {
				charlotte: true,
				onremove: true,
				mark: true,
				forced: true,
				popup: false,
				firstDo: true,
				marktext: "昂",
				intro: {
					markcount() {
						return 0;
					},
					content: "激昂：你击杀一名角色",
				},
				trigger: {
					source: "die",
				},
				content() {
					player.removeSkill("mryinyuan_sunben");
					player.popup("因缘");
					game.log(player, "恢复了技能", "#g【因缘】");
					player.changeSkin({ characterName: "mrmou_shaosiyuan" }, "mrmou_shaosiyuan_initial");
					player.logSkill("mryiniyuan", null, null, null, [3]);
				},
			},
		},
	},
	mrshuiyu: {
		forced: true,
		locked: true,
		mod: {
			selectTarget(card, player, range) {
				if (_status.currentPhase != player) {
					return;
				}
				if (range[1] == -1) {
					return;
				}
				if (card.name == "sha") {
					range[1] += 1;
				}
			},
		},
	},
	mrhuange: {
		forced: true,
		locked: true,
		trigger: {
			player: "damageEnd",
		},
		filter: function (event, player) {
			let num = _status.currentPhase == player ? 2 : 1;
			return game.hasPlayer(p => p.isIn() && get.distance(p, player) <= num && p.countGainableCards("he"));
		},
		async content(event, trigger, player) {
			let num = _status.currentPhase == player ? 2 : 1,
				numm = trigger.num;
			while (numm) {
				let players = game.filterPlayer(p => p.isIn() && get.distance(p, player) <= num && p.countCards("he")),
					cards = [];
				for (let p of players) {
					const ccards = await player.discardPlayerCard(p, true).set("position", "he").forResultCards();
					if (player.hasUseTarget(ccards[0])) cards.push(ccards[0]);
				}
				if (cards.length) {
					const result = await player
						.chooseButton(["欢歌：是否使用其中的一张牌？", cards], 1)
						.set("ai", button => {
							return get.player().getUseValue(button.link);
						})
						.forResult();
					if (result.bool) {
						let card = result.links[0];
						player.$gain2(card, false);
						await game.delayx();
						await player.chooseUseTarget(true, card, false);
					}
				}
				numm--;
			}
		},
	},
	mrlangyong: {
		forced: true,
		locked: true,
		trigger: {
			player: "loseAfter",
			global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
		},
		filter(event, player) {
			if (player.countCards("h")) {
				return false;
			}
			const evt = event.getl(player);
			return evt && evt.player == player && evt.hs && evt.hs.length > 0;
		},
		async content(event, trigger, player) {
			if (_status.currentPhase != player) {
				player.insertPhase("mrlangyong");
			} else {
				await player.recover();
				let phases = ["phaseZhunbei", "phaseJudge", "phaseDraw", "phaseUse", "phaseDiscard", "phaseJieshu"];
				var evt = _status.event;
				for (var i = 0; i < 15; i++) {
					if (evt && evt.getParent) {
						evt = evt.getParent();
					}
					if (phases.includes(evt.name)) {
						evt.skipped = true;
						break;
					}
				}
				player.addTempSkill("mrlangyong_skip", { player: "phaseEnd" });
			}
		},
		subSkill: {
			skip: {
				forced: true,
				locked: true,
				charlotte: true,
				popup: false,
				trigger: {
					player: ["phaseZhunbeiBefore", "phaseJudgeBefore", "phaseDrawBefore", "phaseUseBefore", "phaseDiscardBefore", "phaseJieshuBefore"],
				},
				content() {
					trigger.cancel();
				},
				onremove: function (player, skill) {
					player.draw(Math.max(1, player.getHistory("skipped").length));
				},
			},
		},
	},
	mryinchang: {
		enable: "phaseUse",
		filterTarget: function (card, player, target) {
			for (var i of game.filterPlayer()) {
				let result = [];
				var list = i.getSkills(null, false, false).filter(function (skill) {
					var info = lib.skill[skill];
					if (info && (info.juexingji || info.dutySkill) && !i.awakenedSkills.includes(skill)) {
						if (info.juexingji) result.add(1);
						else result.add(2);
						return true;
					}
					if (info && info.limited && i.awakenedSkills.includes(skill)) {
						result.add(3);
						return true;
					}
				});
				if (list.length > 0) {
					let str = "",
						ans = ["", "觉醒", "使命", "限定"];
					for (var j = 1; j <= 3; j++) if (result.includes(j)) str += ans[j];
					i.prompt(str, "orange");
				} else i.prompt("额外回合", "wood");
			}
			return true;
		},
		limited: true,
		skillAnimation: true,
		animationColor: "water",
		prompt() {
			const player = get.player();
			return "选择一名角色并摸四张牌。若其拥有未发动过的觉醒技，则你令其发动无视觉醒条件；若其拥有未发动过的使命技，则你令其发动无视使命条件；若其拥有已发动过的限定技，则回合结束后其视为未发动过；否则你令其装备【应声虫】并在回合结束后进行一个额外回合；若你选择你为目标，你需要先受到1点伤害";
		},
		async content(event, trigger, player) {
			const { target } = event;
			player.awakenSkill(event.name);
			if (player == target) await player.damage("nocard");
			await player.draw(4);
			const list = target.getSkills(null, false, false).filter(skill => {
				const info = get.info(skill);
				if ((info?.juexingji || info?.dutySkill) && !target.awakenedSkills.includes(skill)) return true;
				if (info && info.limited && target.awakenedSkills.includes(skill)) return true;
			});
			if (list.length > 0) {
				target.storage.mryinchang_mark = [];
				for (var l of list) {
					const skill = l;
					target.storage.mryinchang_mark.add(skill);
					target.markSkill("mryinchang_mark");
					const info = get.info(skill);
					if (info.juexingji) {
						if (info.filter && !info.charlotte && !info.mryinchang_filter) {
							info.mryinchang_filter = info.filter;
							info.filter = function (event, player) {
								if (player.storage.mryinchang_mark) {
									return true;
								}
								return this.mryinchang_filter.apply(this, arguments);
							};
						}
					} else if (info.dutySkill) {
						const info1 = get.info(skill + "_achieve");
						if (info1.filter && !info1.charlotte && !info1.mryinchang_filter) {
							info1.mryinchang_filter = info1.filter;
							info1.filter = function (event, player) {
								if (player.storage.mryinchang_mark) {
									return true;
								}
								return this.mryinchang_filter.apply(this, arguments);
							};
						}
					} else if (info.limited) {
						target.storage.mryinchang_restore = skill;
						target.addTempSkill("mryinchang_restore");
					}
				}
			} else {
				var card5 = game.createCard2("mryingshengchong", "spade", 1);
				if (target.canEquip(card5)) await target.equip(card5);
				target.insertPhase();
			}
		},
		ai: {
			order: 2,
			expose: 0.2,
			result: {
				target(player, target) {
					if (target != player && player.hasUnknown()) {
						return 0;
					}
					if (target == player && player.hasSkill("mryinchang") && player.hp > 2) {
						return 3;
					}
					var list = target.getSkills(null, false, false).filter(function (skill) {
						var info = lib.skill[skill];
						return info && (info.juexingji || info.dutySkill) && !target.awakenedSkills.includes(skill);
					});
					if (list.length || target.hasJudge("lebu") || target.hasSkillTag("nogain")) {
						return 0;
					}
					return 4;
				},
			},
		},
		subSkill: {
			mark: {
				charlotte: true,
				intro: {
					content(storage, player, skill) {
						let skills = player.storage.mryinchang_mark,
							str1 = "",
							str2 = "",
							str3 = "",
							str = "";
						for (skill of skills) {
							const info = get.info(skill);
							if (info.juexingji) str1 += (str1 == "" ? "" : "、") + "【" + get.translation(skill) + "】";
							if (info.dutySkill) str2 += (str2 == "" ? "" : "、") + "【" + get.translation(skill) + "】";
							if (info.limited) str3 += (str3 == "" ? "" : "、") + "【" + get.translation(skill) + "】";
						}
						if (str1 != "") str += "<li>发动" + str1 + "时无视觉醒条件";
						if (str2 != "") str += (str == "" ? "" : "<br>") + "<li>发动" + str2 + "时无视使命条件";
						if (str3 != "") str += (str == "" ? "" : "<br>") + "<li>回合结束后" + str3 + "视为未发动";
						return str;
					},
				},
				sub: true,
				_priority: 0,
			},
			restore: {
				trigger: {
					global: "phaseEnd",
				},
				forced: true,
				popup: false,
				charlotte: true,
				onremove: true,
				async content(_event, _trigger, player) {
					player.restoreSkill(player.storage.mryinchang_restore, undefined);
					player.unmarkSkill("mryinchang_mark");
				},
			},
		},
		mark: true,
		intro: {
			content: "limited",
		},
		init: (player, skill) => (player.storage[skill] = false),
		_priority: 0,
	},
	mrqinge: {
		trigger: {
			player: "phaseUseBegin",
		},
		async content(event, trigger, player) {
			const cards = get.cards(4);
			await game.cardsGotoOrdering(cards);
			let prompt = "琴歌：选择获得其中任意张点数之和不大于20的牌，然后将其余的牌以任意顺序置于牌堆顶，若你以此法获得的牌数不小于你已损失的体力值，你本回合使用【杀】无距离和次数限制。";
			const chooseToMove = player.chooseToMove(prompt, true);
			chooseToMove.set("list", [["牌堆顶", cards], ["获得"]]);
			chooseToMove.set("filterMove", function (from, to, moved) {
				let sum = 0;
				moved[1].filter(c => (sum += get.number(c)));
				if (moved[0].includes(from.link)) {
					if (typeof to == "number") {
						if (to == 1) return sum + get.number(from.link) <= 20;
						return true;
					} else if (moved[1].includes(to.link)) return sum + get.number(from.link) - get.number(to.link) <= 20;
					return true;
				} else {
					if (typeof to == "number") return true;
					else if (moved[0].includes(to.link)) return sum - get.number(from.link) + get.number(to.link) <= 20;
					return true;
				}
			});
			chooseToMove.set("filterOk", function (moved) {
				let sum = 0;
				moved[1].filter(c => (sum += get.number(c)));
				return sum <= 20;
			});
			chooseToMove.set("processAI", function (list) {
				let ccards = list[0][1].concat(list[1][1]).sort(function (a, b) {
					return get.useful(b) - get.useful(a);
				});
				let sum = 0,
					buttom = [];
				while (ccards.length) {
					let card = ccards[0];
					sum += get.number(card);
					if (sum > 20) break;
					buttom.push(card);
					ccards.shift();
				}
				return [ccards, buttom];
			});
			const result = await chooseToMove.forResult();
			if (result.bool) {
				const list = result.moved[0];
				cards.removeArray(list);
				await game.cardsGotoPile(list.reverse(), "insert");
			}
			game.updateRoundNumber();
			if (cards.length) {
				let num = cards.length;
				await player.gain(cards, "draw");
				if (num >= player.maxHp - player.hp) await player.addTempSkill("mrqinge_infini");
			}
		},
		subSkill: {
			infini: {
				forced: true,
				locked: true,
				charlotte: true,
				mark: true,
				marktext: "琴",
				intro: {
					content: "本回合你使用【杀】无次数和距离限制",
				},
				mod: {
					cardUsable: function (card, player) {
						if (card.name == "sha") return Infinity;
					},
					targetInRange: function (card, player) {
						if (card.name == "sha") return true;
					},
				},
			},
		},
	},
	mrshoukuan: {
		forced: true,
		locked: true,
		usable: 3,
		trigger: {
			player: "useCard",
			target: "useCardToTargeted",
		},
		init: function (player) {
			if (typeof player.storage.mrshoukuan === "undefined") player.storage.mrshoukuan = 0;
			player.storage.mrshoukuan_choose = [];
		},
		filter: function (event, player, name) {
			return player.countMark("mrshoukuan_tag") < 4 + player.storage.mrshoukuan * 2 && ((name == "useCard" && event.targets && event.targets.some(p => p != player)) || (name != "useCard" && event.player != player));
		},
		async content(event, trigger, player) {
			player.addMark("mrshoukuan_tag");
		},
		group: ["mrshoukuan_effect"],
		subSkill: {
			effect: {
				locked: true,
				trigger: {
					player: "useCardToPlayered",
				},
				filter: function (event, player) {
					return (event.card.name == "sha" || (get.type(event.card) == "trick" && get.tag(event.card, "damage") > 0)) && player.countMark("mrshoukuan_tag") && event.isFirstTarget;
				},
				check: function (event, player) {
					return -get.attitude(player, event.target);
				},
				async cost(event, trigger, player) {
					var list = ["1. 令该牌伤害+1", "2. 获得所有目标角色区域内的一张牌", "3. 摸一张牌且本回合手牌上限+2"];
					var choiceList = ui.create.dialog(`###是否发动【受款】###<div class="text center">请选择一项并移除一个“凯旋”标记，然后移除该选项，若选项均被移除，你增加1点体力上限与体力，并重置选项。</div>`, "forcebutton", "hidden");
					choiceList.add([
						list.map((item, i) => {
							if (player.storage.mrshoukuan_choose.includes(i)) item = `<span style="text-decoration: line-through;">${item}</span>`;
							return [i, item];
						}),
						"textbutton",
					]);
					const result = await player
						.chooseButton(choiceList, [1, 1 + player.storage.mrshoukuan * 2])
						.set("filterButton", function (button) {
							if (player.storage.mrshoukuan) return ui.selected.buttons.length < player.countMark("mrshoukuan_tag");
							if (player.storage.mrshoukuan_choose.includes(button.link)) return false;
							return true;
						})
						.set("ai", function (button) {
							if (button.link == 1 && !trigger.target.countCards("he")) return false;
							if (button.link == 0 && !trigger.target.countCards("he")) return 1.5;
							if (button.link == 1 && trigger.target.countCards("he")) return 1;
							return 0.5;
						})
						.forResult();
					event.result = {
						bool: result.bool,
						cost_data: result.links,
					};
				},
				async content(event, trigger, player) {
					await player.removeMark("mrshoukuan_tag", event.cost_data.length);
					let targets = trigger.targets;
					for (var i = 0; i < 3; i++) {
						if (!event.cost_data.includes(i)) continue;
						let num = i;
						if (num == 0) {
							var map = trigger.customArgs;
							targets.forEach(p => {
								var id = p.playerid;
								if (!map[id]) map[id] = {};
								if (!map[id].extraDamage) map[id].extraDamage = 0;
								map[id].extraDamage++;
							});
						}
						if (num == 1) {
							targets.forEach(p => player.gainPlayerCard(p, "hej", true));
						}
						if (num == 2) {
							await player.draw(1 + player.storage.mrshoukuan);
							await player.addTempSkill("mrshoukuan_maxhand");
						}
						if (!player.storage.mrshoukuan) {
							player.storage.mrshoukuan_choose.add(num);
							if (player.storage.mrshoukuan_choose.length == 3) {
								player.storage.mrshoukuan_choose = [];
								await player.gainMaxHp();
								await player.recover();
							}
						}
					}
				},
			},
			tag: {
				marktext: "凯",
				intro: {
					name: "凯旋",
					content: "当前共有#个“凯旋”标记",
				},
			},
			maxhand: {
				forced: true,
				locked: true,
				charlotte: true,
				mod: {
					maxHandcard: function (player, num) {
						return num + 2;
					},
				},
			},
		},
	},
	mrzaiji: {
		skillAnimation: true,
		animationColor: "thunder",
		unique: true,
		juexingji: true,
		trigger: {
			global: "phaseZhunbei",
		},
		forced: true,
		derivation: ["mrshoukuan_rewrite", "mrshicang"],
		filter: function (event, player) {
			return player.maxHp >= Math.max(6, game.players.length);
		},
		async content(event, trigger, player) {
			await player.awakenSkill("mrzaiji");
			await player.loseMaxHp();
			await player.addSkill("mrshicang");
			player.storage.mrshoukuan = 1;
			player.storage.mrshoukuan_choose = [];
			game.log(player, "修改了", "#g【受款】");
		},
	},
	mrshicang: {
		trigger: {
			player: "phaseUseEnd",
		},
		filter: function (event, player) {
			return player.countCards("h").filter(c => c.name == "sha").length;
		},
		filterCard: function (card) {
			return card.name == "sha";
		},
		selectCard: 1,
		async content(event, trigger, player) {
			ui.cardPile.appendChild(event.cards[0]);
			game.updateRoundNumber();
			await player.draw();
		},
		group: ["mrshicang_effect"],
		subSkill: {
			effect: {
				trigger: {
					global: "phaseJieshuBegin",
				},
				filter(event, player) {
					return (
						event.player != player &&
						ui.cardPile.childElementCount <= game.players.length * 8 &&
						get.cardPile2(function (card) {
							return card.name == "sha" && player.canUse(card, event.player, false);
						})
					);
				},
				check(event, player) {
					return get.attitude(player, event.player) < 0 && get.effect(event.player, { name: "sha" }, player, player) > 0;
				},
				logTarget: "player",
				skillAnimation: true,
				animationColor: "wood",
				async content(event, trigger, player) {
					while (trigger.player.isIn()) {
						var card = get.cardPile2(function (card) {
							return card.name == "sha" && player.canUse(card, trigger.player, false);
						});
						if (card) player.useCard(card, trigger.player, false);
						else break;
					}
				},
				ai: {
					threaten: 1.5,
				},
			},
		},
	},
	mr_haiyuanbeiji: {
		forced: true,
		charlotte: true,
		equipSkill: true,
		trigger: {
			player: ["damageBegin", "loseHpBegin"],
		},
		firstDo: true,
		mark: true,
		marktext: "戢",
		intro: {
			content(storage, player, skill) {
				return "当前已受到伤害或失去体力" + player.storage.mr_haiyuanbeiji + "/3点，累计3点后获得1点护甲，触发两次后弃置【海原贝戢】，当前已触发：" + player.storage.mr_haiyuanbeiji_count + "/2";
			},
			markcount(storage, player) {
				return player.storage.mr_haiyuanbeiji + "/3";
			},
		},

		filter: function (event, player) {
			return event.num > 0;
		},
		async content(event, trigger, player) {
			player.storage.mr_haiyuanbeiji = player.storage.mr_haiyuanbeiji + trigger.num;
			if (player.storage.mr_haiyuanbeiji >= 3) {
				player.storage.mr_haiyuanbeiji -= 3;
				player.changeHujia(1, "gain", 5);
				player.storage.mr_haiyuanbeiji_count++;
				if (player.storage.mr_haiyuanbeiji_count == 2) {
					let card = player.getCards("e", card => card.name == "mrhaiyuanbeiji");
					if (card) player.discard(card);
					player.storage.mr_haiyuanbeiji_count = 0;
				}
			}
			player.update();
		},
		group: ["mr_haiyuanbeiji_beige", "mr_haiyuanbeiji_chaosheng", "mr_haiyuanbeiji_beigezhudong"],
		subSkill: {
			beige: {
				marktext: "悲",
				intro: {
					name: "悲歌",
					content: "当前共有#层“悲歌”",
				},
				forced: true,
				locked: true,
				trigger: {
					player: ["phaseBegin", "phaseEnd"],
				},
				async content(event, trigger, player) {
					player.storage.mr_haiyuanbeiji_beige++;
					player.update();
				},
			},
			beigezhudong: {
				enable: "phaseUse",
				async content(event, trigger, player) {
					let count = 0,
						num = player.storage.mr_haiyuanbeiji_beige;
					while (true) {
						if (count == num) break;
						const card = get.cards()[0];
						if (!card) break;
						const content = ["牌堆顶", [card]];
						game.log(player, "观看了牌堆顶的一张牌");
						await player.chooseControl("ok").set("dialog", content);
						if (player.hasUseTarget(card, true, false) || (get.info(card).notarget && lib.filter.cardEnabled(card, player))) await player.chooseUseTarget(card, true).set("addCount", false).forResult();
						count++;
					}
					let card = player.getCards("e", card => card.name == "mrhaiyuanbeiji");
					if (card) player.discard(card);
				},
				ai: {
					order: 1,
					result: {
						player(player) {
							return 1;
						},
					},
				},
			},
			chaosheng: {
				marktext: "潮",
				intro: {
					name: "潮声",
					content: "当前共有#/7层“潮声”，达到7层时摸三张牌并使下次造成的伤害+1",
					markcount(storage, player) {
						return player.storage.mr_haiyuanbeiji_chaosheng + "/7";
					},
				},
				forced: true,
				locked: true,
				trigger: {
					player: "useCard0",
				},
				filter: function (event, player) {
					return event.cards;
				},
				async content(event, trigger, player) {
					player.storage.mr_haiyuanbeiji_chaosheng += trigger.cards.length;
					if (player.storage.mr_haiyuanbeiji_chaosheng >= 7) {
						await player.draw(3);
						if (typeof player.storage.mr_haiyuanbeiji_damage === "undefined") player.storage.mr_haiyuanbeiji_damage = 1;
						else player.storage.mr_haiyuanbeiji_damage++;
						player.addSkill("mr_haiyuanbeiji_damage");
						player.markSkill("mr_haiyuanbeiji_damage");
						player.storage.mr_haiyuanbeiji_chaosheng -= 7;
						player.storage.mr_haiyuanbeiji_beige++;
					}
					player.update();
				},
			},
			damage: {
				onremove: function (player, skill) {
					player.storage.mr_haiyuanbeiji_damage = 0;
				},
				trigger: {
					source: "damageBegin1",
				},
				forced: true,
				charlotte: true,
				content() {
					trigger.num += player.storage.mr_haiyuanbeiji_damage;
					player.removeSkill("mr_haiyuanbeiji_damage");
				},
				mark: true,
				intro: {
					name: "潮汐",
					content: "造成伤害时，此伤害+#",
				},
			},
		},
	},
	mrqianxi: {
		actionSkill: true,
		init: function (player, skill) {
			if (typeof player.xingdongtiao === "undefined")
				player.xingdongtiao = {
					Skip: ["gameStart", "useCardBegin", "gainBegin", "phaseBeginStart", "damageBegin"],
					Name: "行动条",
					Color: "#DC143C",
					Max: 100,
					Np: 0,
				};
		},
		enable: "phaseUse",
		viewAsFilter(player) {
			return player.countCards("hes") > 2;
		},
		viewAs: {
			name: "sha",
			nature: "ice",
		},
		selectCard: 2,
		filterCard: true,
		check(card) {
			let player = _status.event.player;
			if (player.getEquips("mrhaiyuanbeiji").length || (!player.hasCard("sha") && player.countCards("hs") > 4)) return 6.3 - get.value(card);
			else return 5.1 - get.value(card);
		},
		position: "hes",
		prompt: "出牌阶段限一次，你可以将两张牌当作一张冰属性【杀】使用，若你拥有【海原贝戟】，则你令此牌所有目标获得【汐梦】",
		derivation: "mrximeng",
		onuse: function (result, player) {
			if (player.getEquips("mrhaiyuanbeiji").length) {
				for (var target of result.targets) {
					target.addTempSkill("mrximeng");
					game.log(player, "令", target, "获得了", "#g【汐梦】");
				}
			}
		},
		ai: {
			order(item, player) {
				let res = 3.2 + player.getEquips("mrhaiyuanbeiji").length;
				if (player.hasSkillTag("presha", true, null, true)) {
					res = 10;
				}
				if (typeof item !== "object" || !game.hasNature(item, "linked") || game.countPlayer(cur => cur.isLinked()) < 2) {
					return res;
				}
				//let used = player.getCardUsable('sha') - 1.5, natures = ['thunder', 'fire', 'ice', 'kami'];
				let uv = player.getUseValue(item, true);
				if (uv <= 0) {
					return res;
				}
				let temp = player.getUseValue("sha", true) - uv;
				if (temp < 0) {
					return res + 0.15;
				}
				if (temp > 0) {
					return res - 0.15;
				}
				return res;
			},
			result: {
				target(player, target) {
					return lib.card.sha.ai.result.target.apply(this, arguments);
				},
			},
			yingbian(card, player, targets, viewer) {
				if (get.attitude(viewer, player) <= 0) {
					return 0;
				}
				var base = 0,
					hit = false;
				if (get.cardtag(card, "yingbian_hit")) {
					hit = true;
					if (
						targets.some(target => {
							return target.mayHaveShan(viewer, "use") && get.attitude(viewer, target) < 0 && get.damageEffect(target, player, viewer, get.natureList(card)) > 0;
						})
					) {
						base += 5;
					}
				}
				if (get.cardtag(card, "yingbian_add")) {
					if (
						game.hasPlayer(function (current) {
							return !targets.includes(current) && lib.filter.targetEnabled2(card, player, current) && get.effect(current, card, player, player) > 0;
						})
					) {
						base += 5;
					}
				}
				if (get.cardtag(card, "yingbian_damage")) {
					if (
						targets.some(target => {
							return (
								get.attitude(player, target) < 0 &&
								(hit ||
									!target.mayHaveShan(viewer, "use") ||
									player.hasSkillTag(
										"directHit_ai",
										true,
										{
											target: target,
											card: card,
										},
										true
									)) &&
								!target.hasSkillTag("filterDamage", null, {
									player: player,
									card: card,
									jiu: true,
								})
							);
						})
					) {
						base += 5;
					}
				}
				return base;
			},
			canLink(player, target, card) {
				if (!target.isLinked() && !player.hasSkill("wutiesuolian_skill")) {
					return false;
				}
				if (player.hasSkill("jueqing") || player.hasSkill("gangzhi") || target.hasSkill("gangzhi")) {
					return false;
				}
				let obj = {};
				if (get.attitude(player, target) > 0 && get.attitude(target, player) > 0) {
					if (
						(player.hasSkill("jiu") ||
							player.hasSkillTag("damageBonus", true, {
								target: target,
								card: card,
							})) &&
						!target.hasSkillTag("filterDamage", null, {
							player: player,
							card: card,
							jiu: player.hasSkill("jiu"),
						})
					) {
						obj.num = 2;
					}
					if (target.hp > obj.num) {
						obj.odds = 1;
					}
				}
				if (!obj.odds) {
					obj.odds = 1 - target.mayHaveShan(player, "use", true, "odds");
				}
				return obj;
			},
			basic: {
				useful: [5, 3, 1],
				value: [5, 3, 1],
			},
			tag: {
				respond: 1,
				respondShan: 1,
				damage(card) {
					if (game.hasNature(card, "poison")) {
						return;
					}
					return 1;
				},
				natureDamage(card) {
					if (game.hasNature(card, "linked")) {
						return 1;
					}
				},
				fireDamage(card, nature) {
					if (game.hasNature(card, "fire")) {
						return 1;
					}
				},
				thunderDamage(card, nature) {
					if (game.hasNature(card, "thunder")) {
						return 1;
					}
				},
				poisonDamage(card, nature) {
					if (game.hasNature(card, "poison")) {
						return 1;
					}
				},
			},
		},
		group: ["mrqianxi_sha"],
		subSkill: {
			sha: {
				forced: true,
				locked: true,
				trigger: {
					global: "phaseEnd",
				},
				filter: function (event, player) {
					return event.player != player;
				},
				async content(event, trigger, player) {
					lib.skill._mrxingdongtiao.changeNp(10);
				},
			},
		},
	},
	mrrumeng: {
		actionSkill: true,
		forced: false,
		locked: true,
		trigger: {
			player: "phaseBegin",
		},
		init: function (player, skill) {
			lib.skill.mrqianxi.init(player, skill);
		},
		filter: function (event, player) {
			return player.hasEquipableSlot(5) && !player.getEquips("mrhaiyuanbeiji").length;
		},
		async content(event, trigger, player) {
			player.skip("phaseUse");
			player.skip("phaseDiscard");
			game.log(player, "跳过了出牌阶段");
			game.log(player, "跳过了弃牌阶段");
			let card = game.createCard2("mrhaiyuanbeiji", "heart", 6);
			if (card) {
				player.$gain2(card, false);
				game.delayx();
				player.equip(card);
			}
			lib.skill._mrxingdongtiao.changeNp(50);
		},
		mod: {
			canBeDiscarded(card, source, player) {
				if (player.getEquips("mrhaiyuanbeiji").includes(card)) {
					return false;
				}
			},
			targetEnabled(card, player, target) {
				if (get.type(card) == "delay" && !player.getEquips("mrhaiyuanbeiji").length) {
					return false;
				}
			},
		},
		prompt2: "回合开始时，若你没有【海原贝戟】且宝物栏未废除，你可以跳过出牌阶段和弃牌阶段然后使用之(替换原有装备)，增加50%行动条",
		group: ["mrrumeng_destroy", "mrrumeng_gain", "mrrumeng_blocker"],
		subSkill: {
			destroy: {
				trigger: {
					global: ["loseEnd", "equipEnd", "addJudgeEnd", "gainEnd", "loseAsyncEnd", "addToExpansionEnd"],
				},
				forced: true,
				filter(event, player) {
					return game.hasPlayer(current => {
						var evt = event.getl(current);
						if (evt && evt.es) return evt.es.some(i => i.name == "mrhaiyuanbeiji");
						return false;
					});
				},
				content() {
					var cards = [];
					game.countPlayer(current => {
						var evt = trigger.getl(current);
						if (evt && evt.es) return cards.addArray(evt.es.filter(i => i.name == "mrhaiyuanbeiji"));
					});
					game.cardsGotoSpecial(cards);
					game.log(cards, "被销毁了");
				},
				sub: true,
				_priority: 0,
			},
			gain: {
				trigger: {
					global: "phaseBefore",
					player: "enterGame",
				},
				forced: true,
				filter(event, player) {
					return (event.name != "phase" || game.phaseNumber == 0) && player.hasEquipableSlot(5) && !player.getEquips("mrhaiyuanbeiji").length;
				},
				content() {
					var card = game.createCard2("mrhaiyuanbeiji", "heart", 6);
					player.$gain2(card, false);
					game.delayx();
					player.equip(card);
				},
			},
			blocker: {
				trigger: {
					player: ["disableEquipBefore", "turnOverBefore", "linkBegin"],
				},
				forced: true,
				filter(event, player) {
					if (event.name == "turnOver") return !player.isTurnedOver() && !player.getEquips("mrhaiyuanbeiji").length;
					else if (event.name == "link") return !player.isLinked() && !player.getEquips("mrhaiyuanbeiji").length;
					return event.slots.includes("equip5");
				},
				content() {
					if (trigger.name == "disableEquip") {
						while (trigger.slots.includes("equip1")) {
							trigger.slots.remove("equip1");
						}
					} else trigger.cancel();
				},
				sub: true,
				_priority: 0,
			},
		},
	},
	mrximeng: {
		forced: true,
		locked: true,
		trigger: {
			player: "phaseEnd",
		},
		mark: true,
		marktext: "冰",
		intro: {
			content: "回合结束时你须弃置两张手牌，否则你获得【冰冻】",
		},
		derivation: "mrbingdong",
		async content(event, trigger, player) {
			const result =
				player.countCards("h") < 2
					? { bool: false }
					: await player
							.chooseToDiscard(2, "弃置两张手牌，否则你获得【冰冻】")
							.set("ai", card => {
								return get.unuseful(card) + player.countCards("h") - player.hp;
							})
							.forResult();
			if (!result.bool && !player.hasSkill("mrbingdong")) {
				player.addSkill("mrbingdong");
			}
			player.removeSkill("mrximeng");
		},
	},
	mrbingdong: {
		forced: true,
		locked: true,
		trigger: {
			player: "phaseUseBefore",
		},
		mark: true,
		marktext: "冰",
		intro: {
			content: "你跳过你的出牌阶段，触发后移除",
		},
		content() {
			trigger.cancel();
			game.log(player, "跳过了出牌阶段");
			player.removeSkill("mrbingdong");
		},
	},
	mrxunji: {
		forced: true,
		locked: false,
		trigger: {
			player: "useCardToPlayered",
		},
		filter: function (event, player) {
			return (event.card.name == "sha" || (get.type(event.card) == "trick" && get.tag(event.card, "damage") > 0)) && event.targets.some(p => !p.hasMark("mrxunji_ling"));
		},
		async content(event, trigger, player) {
			trigger.targets.forEach(p => {
				if (!p.hasMark("mrxunji_ling")) p.addMark("mrxunji_ling");
			});
		},
		group: ["mrxunji_begin", "mrxunji_end", "mrxunji_hou", "mrxunji_reduce"],
		subSkill: {
			ling: {
				marktext: "灵",
				intro: {
					name: "森之灵",
					content: "你已附带上“森之灵”！",
					markcount() {
						return 0;
					},
				},
			},
			xin: {
				marktext: "心",
				intro: {
					name: "森之心",
					content: "当前共有#层“森之心”",
				},
			},
			begin: {
				forced: true,
				trigger: {
					player: "phaseBeginStart",
				},
				filter: function (event, player) {
					return game.hasPlayer(p => p.hasMark("mrxunji_ling"));
				},
				async content(event, trigger, player) {
					let num = game.countPlayer(p => {
						if (p.hasMark("mrxunji_ling")) {
							p.removeMark("mrxunji_ling");
							return true;
						} else return false;
					});
					await player.addMark("mrxunji_xin", Math.min(3, num + player.countMark("mrxunji_xin")));
					await player.recover();
				},
			},
			end: {
				forced: true,
				trigger: {
					player: "phaseEnd",
				},
				filter: function (event, player) {
					return player.hasMark("mrxunji_xin");
				},
				async content(event, trigger, player) {
					let num = player.countMark("mrxunji_xin");
					await player.removeMark("mrxunji_xin", player.countMark("mrxunji_xin"));
					await player.draw(num);
				},
			},
			hou: {
				forced: true,
				trigger: {
					global: "damageSource",
				},
				filter: function (event, player) {
					return event.source && event.source.hasMark("mrxunji_ling") && _status.currentPhase != event.source;
				},
				async content(event, trigger, player) {
					if (player.countMark("mrxunji_xin") < 3) await player.addMark("mrxunji_xin");
					let target = trigger.source,
						pre = target.nextSeat;
					if (_status.currentPhase == pre) {
						target.addTempSkill("mrxunji_nodamage", { target: "phaseEnd" });
					} else {
						game.swapSeat(target, pre);
					}
				},
			},
			nodamage: {
				forced: true,
				charlotte: true,
				trigger: {
					source: "damageBefore",
				},
				async content(event, trigger, player) {
					trigger.cancel();
				},
				mark: true,
				marktext: "寻",
				intro: {
					content: "本回合无法造成伤害",
				},
				ai: {
					effect: {
						player(card, player, target) {
							if (get.tag(card, "damage")) return 0;
						},
					},
				},
			},
			reduce: {
				trigger: {
					global: "damageBegin1",
				},
				filter: function (event, player) {
					return event.source && event.source.hasMark("mrxunji_ling") && _status.currentPhase == event.source;
				},
				forced: true,
				async content(event, trigger, player) {
					const result = await trigger.source.judge().forResult();
					if (result.color == "black") {
						trigger.num--;
					} else {
						await trigger.player.draw();
					}
				},
			},
		},
	},
	mrsenqi: {
		enable: "phaseUse",
		usable: 1,
		filter: function (event, player) {
			let num = player.hasMark("mrxunji_xin") ? 1 : 2;
			return player.countCards("h") >= num && game.countPlayer(p => p != player && p.isIn());
		},
		check(card) {
			return 7 - get.value(card);
		},
		filterCard: true,
		selectCard() {
			return _status.event.player.hasMark("mrxunji_xin") ? 1 : 2;
		},
		position: "h",
		complexCard: true,
		filterTarget: function (card, player, target) {
			return player != target && target.isIn();
		},
		selectTarget() {
			return [1, _status.event.player.countMark("mrxunji_xin") > 1 ? 2 : 1];
		},
		async content(event, trigger, player) {
			let target = event.target;
			target.damage(player);
			if (player.countMark("mrxunji_xin") == 3) {
				let pre = target.nextSeat;
				if (_status.currentPhase == pre) {
					target.addTempSkill("mrxunji_nodamage", { target: "phaseEnd" });
				} else {
					game.swapSeat(target, pre);
				}
			}
		},
		async contentAfter(event, trigger, player) {
			await player.removeMark("mrxunji_xin", player.countMark("mrxunji_xin"));
		},
	},
};

export default skills;
