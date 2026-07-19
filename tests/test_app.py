from pathlib import Path
import unittest

ROOT = Path(__file__).parents[1]


class VillageAppContract(unittest.TestCase):
    def test_mobile_adventure_has_a_playable_map_and_touch_controls(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")
        css = (ROOT / "style.css").read_text(encoding="utf-8")

        self.assertIn('id="game"', html)
        self.assertIn('id="dialogue"', html)
        self.assertIn('id="talk"', html)
        self.assertIn("pointerdown", js)
        self.assertIn("keydown", js)
        self.assertIn("function move", js)
        self.assertIn("function interact", js)
        self.assertIn("npc", js)
        self.assertIn("image-rendering: pixelated", css)
        self.assertIn("touch-action: none", css)

    def test_mobile_controls_use_a_drag_thumbstick_and_portrait_dialogue(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")
        css = (ROOT / "style.css").read_text(encoding="utf-8")

        self.assertIn('id="touch-indicator"', html)
        self.assertIn('id="touch-knob"', html)
        self.assertIn('id="portrait"', html)
        self.assertIn("pointermove", js)
        self.assertIn("this.input.on('pointermove'", js)
        self.assertIn("drawPortrait", js)
        self.assertIn("#touch-indicator", css)
        self.assertIn("#portrait", css)

    def test_generated_bgm_plays_on_mobile_and_switches_for_dialogue(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")
        self.assertIn('id="bgm"', html)
        self.assertIn('id="music"', html)
        self.assertIn("hanamori-day.mp3", js)
        self.assertIn("hanamori-twilight.mp3", js)
        self.assertIn("hanamori-dialogue.mp3", js)
        self.assertIn("function setMusic", js)

    def test_world_map_scrolls_under_the_centered_player(self):
        js = (ROOT / "game.js").read_text(encoding="utf-8")

        self.assertIn("const WORLD", js)
        self.assertIn("function camera", js)
        self.assertIn("function drawWorld", js)
        self.assertIn("this.cameras.main.startFollow", js)
        self.assertIn("setCollideWorldBounds", js)
        self.assertIn("house", js)

    def test_iphone_uses_fullscreen_map_and_anywhere_touch_joystick(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")
        css = (ROOT / "style.css").read_text(encoding="utf-8")

        self.assertNotIn('id="joystick"', html)
        self.assertIn('id="touch-indicator"', html)
        self.assertIn("this.input.on('pointerdown'", js)
        self.assertIn("pointercancel", js)
        self.assertIn("Phaser.Scale.RESIZE", js)
        self.assertIn("100dvh", css)
        self.assertIn("position:fixed", css.replace(" ", ""))
        self.assertIn("inset:0", css.replace(" ", ""))

    def test_character_is_large_and_touch_movement_is_responsive(self):
        js = (ROOT / "game.js").read_text(encoding="utf-8")

        self.assertIn("const MOVE_SPEED=280", js)
        self.assertIn("const CHARACTER_SCALE=1.75", js)
        self.assertIn("player.setVelocity", js)

    def test_game_uses_local_phaser_engine_with_camera_and_arcade_physics(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")

        self.assertIn('vendor/phaser.min.js', html)
        self.assertIn("new Phaser.Game", js)
        self.assertIn("Phaser.AUTO", js)
        self.assertIn("this.cameras.main.startFollow", js)
        self.assertIn("this.physics.add.collider", js)
        self.assertIn("pixelArt:true", js)
        self.assertIn("function preload", js)
        self.assertIn("village-hd2d.png", js)
        self.assertIn("s.add.image", js)
        self.assertIn("hero-sprite.png", js)
        self.assertIn("npc-sprite-2.png", js)

    def test_dialogue_opens_fullscreen_character_cg_and_completes_story(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "game.js").read_text(encoding="utf-8")
        css = (ROOT / "style.css").read_text(encoding="utf-8")

        self.assertIn('id="story"', html)
        self.assertIn('id="story-cg"', html)
        self.assertIn('id="story-text"', html)
        self.assertIn("function advanceStory", js)
        self.assertIn("endStory", js)
        self.assertIn("village-cg-0.png", html)
        self.assertIn("village-cg-${npc.face}.png", js)
        self.assertIn("#story.active", css)


if __name__ == "__main__":
    unittest.main()
