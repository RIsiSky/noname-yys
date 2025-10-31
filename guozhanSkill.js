import { lib, game, ui, get, ai, _status } from "../../noname.js";
import { cast } from "../../noname/util/index.js";

/** @type { importCharacterConfig['skill'] } */
const skills = {
	mrgzshence: {
		usable: 1,
		mainSkill: true,
		preHidden: true,
		init(player) {
			if (player.checkMainSkill("mrgzshence")) {
				player.removeMaxHp();
			}
		},
		enable: "phaseUse",
		filterTarget: function (card, player, target) {
			return true;
		},
		filterCard: () => false,
		selectCard: -1,
		async content(event, trigger, player) {
			let target = event.targets[0];
			game.players.forEach(p => {
				if (p.isFriendOf(target) || p == target) p.addSkill("mrgzjianshang");
			});
		},
	},
	mrgzbuwu: {
		audio: "ext:冥人杀/audio:1",
		forced: true,
		usable: 1,
		trigger: {
			global: ["damageEnd", "loseHpEnd"],
		},
		filter: function (event, player) {
			if (!event.player.isIn()) return false;
			if (event.player == player) return false;
			if (event.player.isFriendOf(player)) return false;
			if (event.player.hp == 1 || event.num >= 2) return true;
		},
		content: function () {
			var card = { name: "sha", isCard: true };
			player.useCard(card, trigger.player, false).card.mrgzbuwu2 = true;
		},
		ai: {
			unequip: true,
			skillTagFilter: function (player, tag, arg) {
				if (!arg || !arg.card || arg.card.mrgzbuwu2 != true) return false;
			},
		},
		_priority: 0,
	},
	mrgzjianshang: {
		forced: true,
		locked: true,
		trigger: {
			player: "damageEnd",
		},
		async content(event, trigger, player) {
			player.loseHp();
			player.chooseToDiscard(true);
			player.removeSkill("mrgzjianshang");
		},
		mark: true,
		marktext: "伤",
		intro: {
			content: "你已被挂上剑伤，受到伤害后失去一点体力并弃置一张牌，触发后移除",
		},
	},
	mrgzguizhan: {
		global: "mrgzguizhan_others",
		ai: {
			threaten: 0.8,
		},
		subSkill: {
			others: {
				usable: 1,
				trigger: {
					source: "damageSource",
				},
				filter: function (event, player) {
					return (
						!player.isUnseen() &&
						event.getParent().name != "mrgzguizhan_others" &&
						player.countCards("h") > 0 &&
						event.player.isIn() &&
						game.hasPlayer(function (current) {
							return current.hasSkill("mrgzguizhan") && player.isFriendOf(current) && !player.hasSkill("mrgzguizhan_used");
						})
					);
				},
				async cost(event, trigger, player) {
					var player = _status.event.player;
					var list = game.filterPlayer(function (current) {
						return current.hasSkill("mrgzguizhan") && player.isFriendOf(current);
					});
					var str = "弃置一张牌，然后令" + get.translation(list);
					if (list.length > 1) str += "中的一人";
					str += "对此次伤害的目标造成1点伤害";
					event.result = await player
						.chooseToDiscard("he")
						.set("prompt", "是否发动【鬼斩】")
						.set("prompt2", str)
						.set("ai", function (card) {
							return 7 - get.value(card);
						})
						.forResult();
				},
				async content(event, trigger, player) {
					var list = game.filterPlayer(function (current) {
						return current.hasSkill("mrgzguizhan") && player.isFriendOf(current);
					});
					let target = list[0];
					if (list.length > 1) {
						const result = await player
							.chooseTarget(true, "选择【鬼斩】造成伤害的来源", function (card, player, target) {
								return list.includes(target);
							})
							.set("list", list)
							.set("ai", function (target) {
								return player.isFriendOf(target);
							})
							.forResult();
						if (result.bool) target = result.targets[0];
					}
					await target.addTempSkill("mrgzguizhan_used");
					await trigger.player.damage(target);
				},
			},
			used: {
				charlotte: true,
				marktext: "斩",
				mark: true,
				intro: {
					content: "本回合已发动【鬼斩】",
				},
			},
		},
	},
	mrgzyingshan: {
		unique: true,
		limited: true,
		mark: true,
		marktext: "闪",
		intro: {
			content: "limited",
		},
		skillAnimation: true,
		init: (player, skill) => (player.storage[skill] = false),
		filter: function (event, player) {
			return player.storage.mrgzyingshan == false;
		},
		enable: "phaseUse",
		filterTarget: function (card, player, target) {
			return true;
		},
		filterCard: () => false,
		selectCard: -1,
		async content(event, trigger, player) {
			player.storage.mrgzyingshan = true;
			player.awakenSkill("mrgzyingshan");
			let target = event.targets[0];
			game.players.forEach(p => {
				if (p.inline(target) || p == target) p.damage(player);
			});
		},
	},
	mrgzdaoyan: {
		audio: "ext:冥人杀/audio:1",
		forced: true,
		locked: true,
		mark: true,
		init: function (player) {
			player.storage.mrgzdaoyan = 7;
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
			return player.storage.mrgzdaoyan > 0;
		},
		content: function () {
			player.storage.mrgzdaoyan -= 1;
			player.changeHujia(1, "gain", 5);
			if (player.storage.mrgzdaoyan == 0) {
				player.gainMaxHp();
				player.recover();
				player.addSkill("mrgzdaoyan_damage");
			}
		},
		subSkill: {
			damage: {
				trigger: {
					source: "damageBefore",
				},
				forced: true,
				locked: true,
				content: function () {
					trigger.num++;
				},
				sub: true,
			},
		},
	},
	mrgzzhoushi: {
		forced: true,
		locked: true,
		trigger: {
			global: "dyingBegin",
		},
		filter: function (event, player) {
			return !player.getStorage("mrgzzhoushi").includes(event.player);
		},
		content: function () {
			player.draw();
			player.markAuto("mrgzzhoushi", [trigger.player]);
		},
		marktext: "咒",
		intro: {
			content: "本局你已对$发动过【咒蚀】",
		},
		sub: true,
	},
	mrgzwanfa: {
		enable: "phaseUse",
		usable: 1,
		filter: function (event, player) {
			return !player.hasSkill("mrgzwanfa_reverse");
		},
		content: function () {
			game.players.forEach(p => {
				if (p.isFriendOf(player)) {
					var hpnum = p.hp;
					var maxhpnum = p.maxHp;
					p.loseHp(Math.floor(hpnum / 2));
					p.draw(Math.floor(hpnum / 2));
					p.changeHujia(Math.floor(maxhpnum / 2), "gain", 5);
				}
				player.addSkill("mrgzwanfa_reverse");
			});
		},
		subSkill: {
			reverse: {
				forced: true,
				locked: true,
				charlotte: true,
				init: function (player) {
					player.storage.mrgzwanfa_reverse = 0;
				},
				trigger: {
					player: ["phaseBeginStart", "phaseEnd"],
				},
				filter(event, player, name) {
					if (name == "phaseEnd") return player.storage.mrgzwanfa_reverse;
					return true;
				},
				content: function () {
					if (triggername == "phaseEnd") {
						player.storage.mrgzwanfa_reverse = 0;
						player.removeSkill("mrgzwanfa_reverse");
					} else {
						player.storage.mrgzwanfa_reverse = 1;
						game.players.forEach(p => {
							if (p.isFriendOf(player)) {
								var hpnum = p.hp;
								var maxhpnum = p.maxHp;
								var hujianum = p.hujia;
								var losehpnum = maxhpnum - hpnum;
								if (losehpnum > hpnum) p.recover(losehpnum - hpnum);
								else if (losehpnum < hpnum) p.loseHp(hpnum - losehpnum);
								if (hujianum + losehpnum < maxhpnum) p.recover(hujianum);
								else p.recover(maxhpnum - losehpnum);
								p.changeHujia(-hujianum);
							}
						});
					}
				},
				mark: true,
				marktext: "万",
				intro: {
					content: "你的下个回合开始时，所有与你势力相同的角色翻转血量，移除所有护甲并回复等量体力，下个回合结束前【万法】失效",
				},
			},
		},
	},
	mrgzjiekong: {
		forced: true,
		locked: true,
		global: "mrgzjiekong_hand",
		subSkill: {
			hand: {
				mod: {
					maxHandcard(player, num) {
						if (game.hasPlayer(p => p.hasSkill("mrgzjiekong") && player.isFriendOf(p))) {
							return num + player.hujia;
						}
					},
				},
			},
		},
	},
	mrgzrumeng: {
		forced: true,
		locked: true,
		trigger: {
			global: "roundStart",
		},
		forced: true,
		filter(event, player) {
			return player.hasEquipableSlot(5) && !player.getEquips("mrhaiyuanbeiji").length;
		},
		async content(event, trigger, player) {
			var card = game.createCard2("mrhaiyuanbeiji", "heart", 6);
			player.$gain2(card, false);
			await game.delayx();
			await player.equip(card);
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
		group: ["mrgzrumeng_destroy", "mrgzrumeng_blocker"],
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
	mrgzlangqing: {
		trigger: {
			player: "phaseBegin",
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
		group: ["mrgzlangqing_respond"],
		subSkill: {
			respond: {
				trigger: {
					global: "respond",
				},
				silent: true,
				filter(event) {
					return event.getParent(5).name == "mrgzlangqing";
				},
				async content(event, trigger, player) {
					await player.draw("nodelay");
				},
				sub: true,
				forced: true,
				popup: false,
				_priority: 1,
			},
		},
	},
	mrgzzhuying: {
		forced: true,
		locked: true,
		trigger: {
			player: "useCard",
		},
		filter(event, player) {
			return event.cards.length && !player.hasSkill("mrgzzhuying_not") && game.countPlayer(current => current.sieged());
		},
		async content(event, trigger, player) {
			let list = game.filterPlayer(current => current.sieged());
			trigger.directHit.addArray(list);
		},
		mod: {
			cardUsable: function (card, player, num) {
				if (card.name == "sha" && player.sieged()) return num + 1;
			},
			maxHandcard: function (player, num) {
				if (player.sieged()) return num + 1;
			},
		},
		group: ["mrgzzhuying_draw", "mrgzzhuying_count"],
		subSkill: {
			count: {
				forced: true,
				locked: true,
				silent: true,
				popup: false,
				trigger: {
					player: "useCardAfter",
				},
				filter(event, player) {
					return event.cards.length && !player.hasSkill("mrgzzhuying_not");
				},
				async content(event, trigger, player) {
					await player.addTempSkill("mrgzzhuying_not");
				},
			},
			draw: {
				forced: true,
				locked: true,
				trigger: {
					global: ["respond", "useCard"],
				},
				filter(event, player) {
					if (!event.respondTo || event.player == player || player != event.respondTo[0] || player.hasSkill("mrgzzhuying_not")) return false;
					var cards = [];
					if (get.itemtype(event.respondTo[1]) == "card") {
						cards.push(event.respondTo[1]);
					} else if (event.respondTo[1].cards) {
						cards.addArray(event.respondTo[1].cards);
					}
					return cards.filterInD("od").length > 0;
				},
				async content(event, trigger, player) {
					await player.draw("nodelay");
				},
			},
			not: {},
		},
	},
	mrgzfutu: {
		trigger: {
			player: "phaseEnd",
		},
		check(event, player) {
			return true;
		},
		async cost(event, trigger, player) {
			event.result = await player
				.chooseTarget(1, "是否发动【覆土】", function (card, player, target) {
					return target.isFriendOf(player);
				})
				.set("ai", target => get.attitude(player, target) * (1 - target.hp / 15))
				.set("prompt2", "回合结束时，你可以选择一名势力与你相同的角色，其获得1点护甲")
				.forResult();
		},
		async content(event, trigger, player) {
			event.targets[0].changeHujia(1, "gain", 5);
		},
		group: ["mrgzfutu_protect"],
		subSkill: {
			protect: {
				forced: true,
				locked: false,
				trigger: {
					player: "damageBegin3",
				},
				lastDo: true,
				filter(event, player) {
					return player.hujia && event.num > player.hujia;
				},
				async content(event, trigger, player) {
					trigger.num = player.hujia;
				},
			},
		},
	},
	mrgzluming: {
		trigger: {
			global: "useCardAfter",
		},
		filter(event, player) {
			return event.card.name == "sha" && event.player != player && event.player.isFriendOf(player) && event.targets.some(p => player.canUse({ name: "sha" }, p, false));
		},
		async cost(event, trigger, player) {
			let list = trigger.targets.filter(p => player.canUse({ name: "sha" }, p, false));
			event.result = await player
				.chooseCardTarget({
					filterCard(card, player) {
						if (get.name(card) != "sha") {
							return false;
						}
						return lib.filter.filterCard.apply(this, arguments);
					},
					filterTarget(card, player, target) {
						return list.includes(target);
					},
					prompt2: "麓鸣：是否对使用一张无距离限制的【杀】",
					position: "h",
					selectTarget: [1, list.length],
					ai1(card) {
						return 7 - get.value(card);
					},
					ai2(target) {
						let ccard = ui.selected.cards.length ? ui.selected.cards[0] : { name: "sha" };
						return -get.attitude(player, target) * get.effect(target, ccard, player, player);
					},
				})
				.forResult();
		},
		async content(event, trigger, player) {
			await player.useCard(event.cards[0], event.targets);
			await player.changeHujia(1, "gain", 5);
		},
	},
	mrgzxingliu: {
		marktext: "星",
		forced: true,
		locked: false,
		intro: {
			content: "当前共有#层“星辰”",
		},
		trigger: {
			global: "useCard",
		},
		filter(event, player) {
			return event.player != player && get.type(event.card, "trick") == "trick" && player.countMark("mrgzxingliu") < 3 && _status.currentPhase == event.player;
		},
		async content(event, trigger, player) {
			player.addMark("mrgzxingliu");
		},
		mod: {
			maxHandcard: function (player, num) {
				return num + player.countMark("mrgzxingliu");
			},
		},
		group: ["mrgzxingliu_sha"],
		subSkill: {
			sha: {
				trigger: {
					global: "phaseJieshu",
				},
				filter(event, player) {
					return event.player != player && player.hasMark("mrgzxingliu") && player.canUse({ name: "sha" }, event.player, false) && !event.player.isFriendOf(player);
				},
				check(event, player) {
					return 1 - get.attitude(player, event.player);
				},
				async content(event, trigger, player) {
					player.removeMark("mrgzxingliu", 1);
					player.useCard({ name: "sha" }, trigger.player).card.mrgzxingliu1 = true;
				},
				prompt2: "视为对当前回合角色使用一张无视防具的【杀】",
				ai: {
					unequip: true,
					skillTagFilter: function (player, tag, arg) {
						if (!arg || !arg.card || arg.card.mrgzxingliu1 != true) return false;
					},
				},
			},
		},
	},
	mrgzjieyuan: {
		trigger: {
			global: "recoverAfter",
		},
		async content(event, trigger, player) {
			await player.draw("nodelay");
			await trigger.player.draw("nodelay");
			player.addMark("mrgzjieyuan");
			if (player.countMark("mrgzjieyuan") == 7) {
				const result = await player
					.chooseTarget(true, 1, "选择一名角色")
					.set("prompt2", "若你拥有七层“缘”，你移去所有“缘”并令一名角色获得一个额外的回合")
					.set("ai", function (target) {
						const player = get.player();
						if (target.hasJudge("lebu") || get.attitude(player, target) <= 0) {
							return -1;
						}
						if (target.isTurnedOver()) {
							return 0.18;
						}
						return get.threaten(target) / Math.sqrt(target.hp + 1) / Math.sqrt(target.countCards("h") + 1);
					})
					.forResult();
				result.targets[0].insertPhase("mrgzjieyuan");
				player.removeMark("mrgzjieyuan", 7);
			}
		},
		marktext: "缘",
		intro: {
			content: "当前共有#层“缘”，若你拥有七层“缘”，你移去所有“缘”并令一名角色获得一个额外的回合",
			markcount(storage, player) {
				return player.countMark("mrgzjieyuan") + "/7";
			},
		},
		group: ["mrgzjieyuan_end"],
		subSkill: {
			end: {
				forced: true,
				locked: false,
				trigger: {
					player: "phaseEnd",
				},
				filter(event, player) {
					if (player.hp % 2 == 1 && player.isDamaged()) return true;
					else if (player.hp % 2 == 0) return true;
				},
				async content(event, trigger, player) {
					if (player.hp % 2 == 1) await player.recover();
					else {
						const result = await player
							.chooseTarget(true, 1, "选择一名角色")
							.set("prompt2", "横置一名角色并对其造成1点火焰伤害")
							.set("ai", function (target) {
								var eff = get.damageEffect(target, player, target, "fire");
								if (target.isLinked()) {
									return eff / 10;
								} else {
									return eff;
								}
							})
							.forResult();
						let target = result.targets[0];
						if (!target.isLinked()) {
							target.link(true);
							game.delay(0.5);
						}
						await target.damage("fire", "nocard");
					}
				},
			},
		},
	},
	mrgzyili: {
		unique: true,
		limited: true,
		mark: true,
		marktext: "屹",
		intro: {
			content: "limited",
		},
		skillAnimation: true,
		animationStr: "屹立不倒",
		animationColor: "water",
		init: (player, skill) => (player.storage[skill] = false),
		derivation: "mrgzchuannu",
		trigger: {
			global: "dying",
		},
		filter: function (event, player) {
			return player.storage.mrgzyili == false && event.player.isFriendOf(player);
		},
		async content(event, trigger, player) {
			player.storage.mrgzyili = true;
			player.awakenSkill("mrgzyili");
			game.countPlayer(p => {
				if (p.isFriendOf(player)) {
					p.recoverTo(p.maxHp);
					p.drawTo(p.maxHp);
				}
			});
			trigger.player.addSkill("mrgzchuannu");
			player.addSkill("mrgzchuannu");
			if (lib.character[player.name1][3].includes("mrgzyili")) {
				player.removeCharacter(0);
			}
			if (lib.character[player.name2][3].includes("mrgzyili")) {
				player.removeCharacter(1);
			}
		},
	},
	mrgzchuannu: {
		usable: 1,
		firstDo: true,
		trigger: {
			source: "damageBefore",
		},
		filter(event, player) {
			return event.player != player;
		},
		async content(event, trigger, player) {
			let target = trigger.player;
			if (!target.hasSkill("mrgzchuannu_unseen")) await target.addSkill("mrgzchuannu_unseen");
			if (!target.isUnseen(2)) {
				const result = await player
					.chooseButton(["暗置" + get.translation(target) + "的一张武将牌", [[target.name1, target.name2], "character"]])
					.set("filterButton", function (button) {
						return !get.is.jun(button.link);
					})
					.forResult();
				if (result.bool) await target.hideCharacter(result.links[0] == target.name1 ? 0 : 1);
			}
		},
		subSkill: {
			unseen: {
				forced: true,
				locked: true,
				charlotte: true,
				popup: false,
				silent: true,
				mark: true,
				marktext: "怒",
				intro: {
					content: "你无法明置武将牌直到你受到伤害后",
				},
				lastDo: true,
				trigger: {
					player: "damageEnd",
				},
				async content(event, trigger, player) {
					player.removeSkill("mrgzchuannu_unseen");
				},
				ai: {
					nomingzhi: true,
				},
			},
		},
	},
	mrgzlingbo: {
		forced: true,
		locked: true,
		init: function (player, skill) {
			player.storage.mrgzlingbo = 4;
		},
		mark: true,
		marktext: "凝",
		intro: {
			name: "凝神",
			content: "当前共有#层“凝神”",
			markcount(storage, player) {
				return player.storage.mrgzlingbo + "/6";
			},
		},
		trigger: {
			global: "phaseEnd",
		},
		content() {
			player.storage.mrgzlingbo++;
			if (player.storage.mrgzlingbo == 6) {
				player.storage.mrgzlingbo = 0;
				player.changeHujia(1, "gain", 5);
			}
			player.update();
		},
	},
	mrgzbaorui: {
		forced: true,
		trigger: {
			global: "damageEnd",
		},
		filter: function (event, player) {
			return event.player.isFriendOf(player) && (event.player.hp == 1 || event.num > 1) && event.source;
		},
		async content(event, trigger, player) {
			if (!trigger.source.hasMark("mrgzbaorui_yuan")) trigger.source.addMark("mrgzbaorui_yuan");
		},
		_priority: 1,
		group: ["mrgzbaorui_effect", "mrgzbaorui_sha"],
		subSkill: {
			yuan: {
				marktext: "怨",
				intro: {
					name: "结怨",
					content: "你已被挂上“结怨”",
					markcount() {
						return 0;
					},
				},
			},
			effect: {
				trigger: {
					global: "phaseJieshu",
				},
				filter(event, player) {
					return event.player.isFriendOf(player) && event.player.hp == 1 && player.countDiscardableCards(player, "he");
				},
				async cost(event, trigger, player) {
					event.result = await player
						.chooseToDiscard("he", "是否发动【抱蕊】")
						.set("prompt2", "弃置一张牌，令" + get.translation(trigger.player) + "回复1点体力，然后其可以使用一张【杀】(无距离限制)")
						.set("ai", function (card) {
							return 7 - get.value(card);
						})
						.forResult();
				},
				async content(event, trigger, player) {
					let target = trigger.player;
					await target.recover();
					await target
						.chooseToUse("抱蕊：是否使用一张【杀】(无距离限制)，若目标拥有“结怨”，则移除之并令此【杀】其无法响应且伤害+1", function (card) {
							if (get.name(card) != "sha") {
								return false;
							}
							return lib.filter.filterCard.apply(this, arguments);
						})
						.set("targetRequired", true)
						.set("complexTarget", true)
						.set("complexSelect", true)
						.set("filterTarget", function (card, player, targe) {
							if (targe == player) {
								return false;
							}
							if (!player.canUse(card, targe, false)) {
								return false;
							}
							return lib.filter.targetEnabled.apply(this, arguments);
						})
						.set("ai2", function (targe) {
							return get.effect(targe, _status.event.card, player, player) * (targe.hasMark("mrgzbaorui_yuan") ? 2 : 1);
						});
				},
			},
			sha: {
				forced: true,
				locked: true,
				popup: false,
				silent: true,
				_priority: 10,
				trigger: {
					global: "useCard",
				},
				filter(event, player) {
					return event.getParent(2).name == "mrgzbaorui_effect" && event.card.name == "sha" && event.targets && event.targets.some(p => p.hasMark("mrgzbaorui_yuan"));
				},
				async content(event, trigger, player) {
					let targets = trigger.targets.filter(p => p.hasMark("mrgzbaorui_yuan"));
					trigger.directHit.addArray(targets);
					trigger.baseDamage++;
					targets.forEach(p => {
						p.removeMark("mrgzbaorui_yuan");
					});
				},
			},
		},
	},
	mrgzaoyi: {
		derivation: ["mrgzbudong"],
		trigger: {
			source: "damageBegin1",
		},
		filter(event, player) {
			return player.countDiscardableCards("h");
		},
		async cost(event, trigger, player) {
			let cards = player.getDiscardableCards("h"),
				target = trigger.player;
			const result = await player
				.chooseButton(['###奥义：选择一种花色？###<div class="text center">当你造成伤害时，你可以弃置一种花色的所有手牌，然后获得不同效果:♠️，伤害+1；♥️，弃置其X张手牌(X为其已损体力值，至少为1)；♣️，获得其装备区所有牌，然后弃置你的武器牌；♦️，获得【不动】至你的下个回合开始；直到回合结束，其他角色不能使用或打出该花色的牌。</div>', [lib.suit.map(i => ["", "", "lukai_" + i]), "vcard"]])
				.set("filterButton", function (button) {
					let suit = button.link[2].slice(6);
					return cards.some(c => get.suit(c) == suit);
				})
				.set("ai", function (button) {
					let player = get.player(),
						suit = button.link[2].slice(6),
						num = player.countDiscardableCards("h").filter(c => get.suit(c) == suit);
					if (suit == "spade") return num < 3;
					else if (suit == "heart") return num <= Math.min(target.countCards("h"), target.maxHp - target.hp);
					else if (suit == "club") return target.countCards("e") && num <= target.countCards("e") - 1;
					else return num < (player.countCards("h") > player.hp ? 2 : 3);
				})
				.forResult();
			let suit_choose = result.bool ? result.links[0][2].slice(6) : null;
			event.result = {
				bool: result.bool,
				cost_data: suit_choose,
			};
		},
		async content(event, trigger, player) {
			let suit = event.cost_data,
				target = trigger.player,
				cards = player.getDiscardableCards("h").filter(c => get.suit(c) == suit);
			await player.discard(cards);
			switch (suit) {
				case "spade": {
					trigger.num++;
					break;
				}
				case "heart": {
					await player.discardPlayerCard(target, Math.max(target.maxHp - target.hp, 1), "h", true);
					break;
				}
				case "club": {
					let ccards = target.getCards("e");
					await player.gain(ccards, "gain2", "log");
					break;
				}
				case "diamond": {
					await player.addTempSkills("mrgzbudong", { player: "phaseBeginStart" });
					break;
				}
			}
			game.countPlayer(p => {
				if (p != player) {
					p.addTempSkill("mrgzaoyi_ban");
					p.markAuto("mrgzaoyi_ban", [suit]);
				}
			});
		},
		subSkill: {
			ban: {
				onremove: true,
				charlotte: true,
				mod: {
					cardEnabled(card, player) {
						if (player.getStorage("mrgzaoyi_ban").includes(get.suit(card))) {
							return false;
						}
					},
					cardRespondable(card, player) {
						if (player.getStorage("mrgzaoyi_ban").includes(get.suit(card))) {
							return false;
						}
					},
					cardSavable(card, player) {
						if (player.getStorage("mrgzaoyi_ban").includes(get.suit(card))) {
							return false;
						}
					},
				},
				mark: true,
				marktext: "奥",
				intro: {
					content: "本回合内不能使用或打出$的牌",
				},
				sub: true,
				_priority: 0,
			},
		},
	},
	mrgzcanyang: {
		trigger: {
			player: "showCharacterAfter",
		},
		filter(event, player) {
			return (
				game.countPlayer(p => player.canUse({ name: "sha" }, p, true)) &&
				event.toShow.some(name => {
					return get.character(name, 3).includes("mrgzcanyang");
				})
			);
		},
		async cost(event, trigger, player) {
			await player.chooseUseTarget({ name: "sha" }).set("prompt", "是否发动【残阳】").set("prompt2", "视为对一名角色使用一张【杀】");
		},
	},
	mrgzbudong: {
		forced: true,
		locked: true,
		mod: {
			targetEnabled(card, target, player) {
				if (player != target && get.type(card, "trick") == "trick") return false;
			},
		},
		group: ["mrgzbudong_gain"],
		subSkill: {
			gain: {
				trigger: {
					player: "changeSkillsAfter",
				},
				filter(event, player) {
					game.log("yes");
					return event.addSkill.includes("mrgzbudong") && !player.isUnseen(2);
				},
				async cost(event, trigger, player) {
					const result = await player
						.chooseButton(["不动：是否暗置你的一张武将牌", [[player.name1, player.name2], "character"]])
						.set("filterButton", function (button) {
							return !get.is.jun(button.link);
						})
						.set("ai", function (button) {
							return button.link == player.name1;
						})
						.forResult();
					let choose = result.links[0] == player.name1 ? 0 : 1;
					event.result = {
						bool: result.bool,
						cost_data: choose,
					};
				},
				async content(event, trigger, player) {
					player.hideCharacter(event.cost_data);
				},
			},
		},
	},
	mrgzfenglang: {
		init: function (player) {
			player.storage.mrgzfenglang_red = 1;
			player.storage.mrgzfenglang_black = 1;
		},
		enable: ["chooseToUse", "chooseToRespond"],
		filter(event, player) {
			for (var i of lib.inpile) {
				var type = get.type(i, "trick");
				if (type == "basic" && event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event) && player.countCards("hes", card => get.color(card) == "red") >= player.storage.mrgzfenglang_red) {
					return true;
				} else if (type == "trick" && event.filterCard(get.autoViewAs({ name: i }, "unsure"), player, event) && player.countCards("hes", card => get.color(card) == "black") >= player.storage.mrgzfenglang_black) {
					return true;
				}
			}
			return false;
		},
		chooseButton: {
			dialog(event, player) {
				var list = [];
				for (var i = 0; i < lib.inpile.length; i++) {
					var name = lib.inpile[i];
					if (name == "sha") {
						if (event.filterCard(get.autoViewAs({ name }, "unsure"), player, event) && player.countCards("hes", card => get.color(card) == "red") >= player.storage.mrgzfenglang_red) {
							list.push(["基本", "", "sha"]);
						}
						for (var nature of lib.inpile_nature) {
							if (event.filterCard(get.autoViewAs({ name, nature }, "unsure"), player, event) && player.countCards("hes", card => get.color(card) == "red") >= player.storage.mrgzfenglang_red) {
								list.push(["基本", "", "sha", nature]);
							}
						}
					} else if (get.type(name) == "basic" && event.filterCard(get.autoViewAs({ name }, "unsure"), player, event) && player.countCards("hes", card => get.color(card) == "red") >= player.storage.mrgzfenglang_red) {
						list.push(["基本", "", name]);
					} else if (get.type(name, "trick") == "trick" && event.filterCard(get.autoViewAs({ name }, "unsure"), player, event) && player.countCards("hes", card => get.color(card) == "black") >= player.storage.mrgzfenglang_black) {
						list.push(["锦囊", "", name]);
					}
				}
				return ui.create.dialog("封狼", [list, "vcard"]);
			},
			check(button) {
				if (_status.event.getParent().type != "phase") {
					return 1;
				}
				var player = _status.event.player;
				return (
					player.getUseValue({
						name: button.link[2],
						nature: button.link[3],
					}) + 1
				);
			},
			backup(links, player) {
				return {
					filterCard: function (card) {
						let type = get.type(links[0][2], "trick");
						if (type == "basic") return get.color(card) == "red";
						else return get.color(card) == "black";
					},
					selectCard() {
						let type = get.type(links[0][2], "trick");
						return type == "basic" ? player.storage.mrgzfenglang_red : player.storage.mrgzfenglang_black;
					},
					ai1(card) {
						return 7 - get.value(card);
					},
					position: "hes",
					viewAs: { name: links[0][2], nature: links[0][3] },
					onuse(result, player) {
						let type = get.type(links[0][2], "trick");
						if (type == "basic") {
							player.storage.mrgzfenglang_red++;
							if (player.storage.mrgzfenglang_red == player.maxHp) {
								player.storage.mrgzfenglang_red = 1;
								player.draw();
							}
						} else if (type == "trick") {
							player.storage.mrgzfenglang_black++;
							if (player.storage.mrgzfenglang_black == player.maxHp) {
								player.storage.mrgzfenglang_black = 1;
								player.draw();
							}
						}
					},
				};
			},
			prompt(links, player) {
				return "将" + get.cnNumber(get.type(links[0][2], "trick") == "basic" ? player.storage.mrgzfenglang_red : player.storage.mrgzfenglang_black) + "张" + (get.type(links[0][2], "trick") == "basic" ? "红色" : "黑色") + "牌当作" + (get.translation(links[0][3]) || "") + "【" + get.translation(links[0][2]) + "】使用或打出";
			},
		},
		hiddenCard(player, name) {
			if (!lib.inpile.includes(name)) {
				return false;
			}
			var type = get.type(name, "trick");
			if (type == "basic") return player.countCards("hes", card => get.color(card) == "red") >= player.storage.mrgzfenglang_red;
			else if (type == "trick") return player.countCards("hes", card => get.color(card) == "black") >= player.storage.mrgzfenglang_black;
		},
		ai: {
			fireAttack: true,
			respondSha: true,
			respondShan: true,
			skillTagFilter(player) {
				if (!player.countCards("hes", card => get.color(card) == "red")) {
					return false;
				}
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
	mrgzguyan: {
		derivation: ["mrgzguanjun"],
		init(player) {
			/** @type {PlayerGuozhan} */
			const playerRef = cast(player);
			playerRef.checkMainSkill("mrgzguyan");
		},
		mainSkill: true,
		zhenfa: "inline",
		inherit: "mrgzguanjun",
		filter(event, player) {
			return _status.currentPhase && _status.currentPhase.inline(player) && !player.hasSkill("mrgzguanjun") && player.countCards("h") && game.countPlayer(p => p.isFriendOf(player) && p != player);
		},
		prompt() {
			return lib.translate["mrgzguanjun_info"];
		},
	},
	mrgzguanjun: {
		enable: "phaseUse",
		filter(event, player) {
			return player.countCards("h") && game.countPlayer(p => p.isFriendOf(player) && p != player);
		},
		filterCard: true,
		selectCard: -1,
		filterTarget(card, player, target) {
			return target.isFriendOf(player);
		},
		selectTarget: 1,
		async content(event, trigger, player) {
			await event.target.gain(event.cards, "gain2", "log");
			await event.target.recover();
			await player.draw("nodelay");
		},
	},
	mrgzshenyu: {
		forced: true,
		locked: true,
		firstDo: true,
		marktext: "神",
		intro: {
			content: "本局你已对$发动过【神域】",
		},
		trigger: {
			global: "dyingBefore",
		},
		filter(event, player) {
			return event.reason && event.reason.source && event.reason.source == player;
		},
		async content(event, trigger, player) {
			trigger.player.addTempSkill("mrgzshenyu_ban", { player: "dyingAfter" });
			player.markAuto("mrgzshenyu", [trigger.player]);
		},
		global: "mrgzshenyu_sha",
		subSkill: {
			sha: {
				enable: "phaseUse",
				usable: 1,
				filter(event, player) {
					if (player.hasSkill("mrgzshenyu")) return false;
					return (
						player.countCards("he") &&
						game.filterPlayer(function (current) {
							return current.hasSkill("mrgzshenyu") && player.isFriendOf(current);
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
						return current.hasSkill("mrgzshenyu") && player.isFriendOf(current);
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
						return current.hasSkill("mrgzshenyu") && player.isFriendOf(current);
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
						.chooseTarget(true, "【神域】：选择让" + get.translation(target) + "使用雷【杀】的目标", function (card, player, targett) {
							return targett != target;
						})
						.set("ai", function (targett) {
							return get.effect(targett, { name: "sha" }, target, target);
						})
						.forResult();
					await target.useCard({ name: "sha", isCard: true, nature: "thunder" }, result2.targets[0], false);
					await player.addTempSkill("mrgzshenyu_not");
				},
				ai: {
					order: 3,
					threaten: 1.5,
					result: {
						player: 2,
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
			ban: {
				forced: true,
				locked: true,
				mark: true,
				marktext: "封",
				intro: {
					content(storage, player, skill) {
						let str = "<li>锁定技，你无法使用或打出手牌且非锁定技失效至脱离濒死状态";
						const list = player.getSkills(null, false, false).filter(function (i) {
							return lib.skill.mrgzshenyu_ban.skillBlocker(i, player);
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
					return skill != "mrgzshenyu_ban" && !get.is.locked(skill, player) && !lib.skill[skill].charlotte && !lib.skill[skill].persevereSkill;
				},
				mod: {
					cardEnabled2(card, player, now) {
						if (get.position(card) == "h") {
							return false;
						}
					},
				},
			},
		},
	},
	mrgztianlei: {
		forced: true,
		locked: true,
		mod: {
			cardname(card, player) {
				if (card.name == "tao") {
					return "jiu";
				}
			},
			cardnature(card, player) {
				if (card.name == "sha") {
					return "thunder";
				}
			},
			cardUsable(card, player) {
				if (card.name == "sha" && game.hasNature(card, "thunder")) {
					return Infinity;
				}
				if (card.name == "jiu") {
					return Infinity;
				}
			},
		},
	},
	mrgzguanghui: {
		trigger: {
			player: "showCharacterAfter",
		},
		init: function (player) {
			player.storage.mrgzguanghui_effect = null;
		},
		filter(event, player, name) {
			if (!game.hasPlayer(current => current != player)) {
				return false;
			}
			return event.toShow.some(name => {
				return get.character(name, 3).includes("mrgzguanghui");
			});
		},
		onremove(player) {
			player.removeSkill("mrgzguanghui_effect");
		},
		async content(event, trigger, player) {
			const result = await player
				.chooseTarget("请选择【光辉】的目标", true, lib.filter.notMe)
				.set("ai", target => {
					var att = get.attitude(_status.event.player, target);
					if (att > 0) {
						return 1 + att;
					}
					return Math.random();
				})
				.set("prompt2", lib.translate.mrgzguanghui_info)
				.forResult();
			if (result.bool) {
				var target = result.targets[0];
				player.logSkill("mrgzguanghui", target);
				player.storage.mrgzguanghui_effect = target;
				player.addSkill("mrgzguanghui_effect");
			}
		},
		subSkill: {
			effect: {
				charlotte: true,
				onremove: true,
				trigger: {
					player: "hideCharacterBefore",
				},
				filter(event, player) {
					return get.character(event.toHide, 3).includes("mrgzguanghui");
				},
				forced: true,
				content() {
					trigger.cancel();
				},
				mark: "character",
				intro: {
					content: "已选择$",
				},
				group: ["mrgzguanghui_recover", "mrgzguanghui_phaseuse", "mrgzguanghui_clear"],
				sub: true,
				_priority: 0,
			},
			recover: {
				forced: true,
				trigger: {
					global: "dyingBegin",
				},
				filter(event, player) {
					return event.player == player.storage.mrgzguanghui_effect;
				},
				content() {
					trigger.player.recoverTo(1);
					player.loseHp();
				},
			},
			phaseuse: {
				forced: true,
				trigger: {
					player: "phaseAfter",
				},
				filter(event, player) {
					return player.getStat("damage") && player.storage.mrgzguanghui_effect;
				},
				async content(event, trigger, player) {
					let target = player.storage.mrgzguanghui_effect;
					await target.draw(player.getStat("damage"), "nodelay");
					target.phaseUse();
				},
			},
			clear: {
				trigger: {
					global: "die",
					player: ["hideCharacterEnd", "removeCharacterEnd"],
				},
				forced: true,
				filter(event, player) {
					if (event.name == "die") {
						return event.player == player.storage.mrgzguanghui_effect;
					}
					if (event.name == "removeCharacter") {
						return get.character(event.toRemove, 3).includes("mrgzguanghui");
					}
					return get.character(event.toHide, 3).includes("mrgzguanghui");
				},
				content() {
					"step 0";
					player.removeSkill("mrgzguanghui_effect");
					if (trigger.name != "die") {
						event.finish();
					}
					("step 1");
					if (get.character(player.name1, 3).includes("mrgzguanghui")) {
						player.hideCharacter(0);
					}
					if (get.character(player.name2, 3).includes("mrgzguanghui")) {
						player.hideCharacter(1);
					}
				},
				sub: true,
				sourceSkill: "mrgzguanghui",
				_priority: 0,
			},
		},
	},
	mrgzguangdi: {
		forced: true,
		locked: true,
		trigger: {
			player: "damageEnd",
		},
		filter(event, player) {
			return event.source && event.source != player;
		},
		async content(event, trigger, player) {
			let target = trigger.source;
			await target.addTempSkill("mrgzguangdi_damage", { player: "damageEnd" });
			let card = target.getCards("e", card => get.subtype(card) == "equip2");
			if (card) target.discard(card);
		},
		subSkill: {
			damage: {
				forced: true,
				locked: true,
				charlotte: true,
				trigger: {
					player: "damageBegin3",
				},
				async content(event, trigger, player) {
					trigger.num++;
				},
				mark: true,
				marktext: "涤",
				intro: {
					content: "下次受到伤害时伤害+1",
				},
			},
		},
	},
	mrgzqingyu: {
		forced: true,
		locked: true,
		popup: false,
		trigger: {
			global: "recoverEnd",
		},
		init: function (player) {
			player.storage.mrgzqingyu = 0;
		},
		filter(event, player) {
			return !event.player.isFriendOf(player);
		},
		async content(event, trigger, player) {
			player.storage.mrgzqingyu = Math.min(player.maxHp + 3, player.storage.mrgzqingyu + trigger.num);
			player.update();
		},
		mark: true,
		marktext: "晴",
		intro: {
			name: "日光能量",
			content: "当前共有#点日光能量",
			markcount: function (storage, player) {
				return player.storage.mrgzqingyu + "/" + (player.maxHp + 3);
			},
			onunmark: true,
		},
		group: ["mrgzqingyu_recover"],
		subSkill: {
			recover: {
				trigger: {
					global: "phaseEnd",
				},
				filter: function (event, player) {
					return !event.player.isFriendOf(player) && game.countPlayer(p => p.isFriendOf(player) && p.isDamaged()) && player.storage.mrgzqingyu > 1;
				},
				async cost(event, trigger, player) {
					let players = game.filterPlayer(p => p.isFriendOf(player) && p.isDamaged());
					event.result = await player
						.chooseTarget(1, "是否令一名已受伤的同势力角色回复Y点体力(Y为其已损体力值的一半，向上取整)，每回复1点体力你便消耗2点“日光能量”。", function (card, player, target) {
							return players.includes(target);
						})
						.set("ai", target => (target.maxHp - target.hp) / 2)
						.forResult();
				},
				async content(event, trigger, player) {
					let target = event.targets[0];
					let num = Math.min(Math.ceil(target.maxHp - target.hp), Math.floor(player.storage.mrgzqingyu / 2));
					player.storage.mrgzqingyu -= 2 * num;
					await target.recover(num);
				},
			},
		},
	},
	mrgzziyang: {
		viceSkill: true,
		skillAnimation: true,
		animationColor: "yellow",
		init(player) {
			/** @type {PlayerGuozhan} */
			const playerRef = cast(player);
			playerRef.checkViceSkill("mrgzziyang");
			if (typeof player.storage.mrqingyu === "undefined") player.storage.mrqingyu = 0;
		},
		preHidden: true,
		trigger: {
			global: "dyingBegin",
		},
		sortByHp(list) {
			let lists = list;
			if (!Array.isArray(list)) {
				lists = [list];
			}
			let j = lists.length - 1;
			while (j) {
				for (var i = 0; i < j; i++) {
					if (lists[i].getHp() > lists[i + 1].getHp()) {
						[lists[i], lists[i + 1]] = [lists[i + 1], lists[i]];
					}
				}
				j--;
			}
			return lists;
		},
		filter(event, player) {
			return event.player.isFriendOf(player) && player.hasSkill("mrgzqingyu", null, null, true);
		},
		async content(event, trigger, player) {
			let players = game.filterPlayer(p => p.isDamaged() && p.isFriendOf(player));
			game.log(players);
			await trigger.player.recoverTo(1);
			while (player.storage.mrgzqingyu > 1 && players.length) {
				players = lib.skill.mrgzziyang.sortByHp(players);
				game.log(players);
				player.storage.mrgzqingyu -= 2;
				await players[0].recover();
				if (!players[0].isDamaged()) players.shift();
			}
			await player.changeVice();
			if (player != trigger.player) await trigger.player.changeVice();
		},
	},
};

export default skills;
