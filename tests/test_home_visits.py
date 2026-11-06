import unittest

import server


class CleanHomeTests(unittest.TestCase):
    def test_keeps_known_items_only(self):
        home = server.clean_home({'house': 'Rose Cottage', 'floor': ['lamp', 'evil<script>', 'teddy', 3], 'wall': ['ribbon', 'clock', 'painting_sea'], 'pet': 'bunny', 'name': 'x'})
        self.assertEqual(home, {'house': 'Rose Cottage', 'floor': ['lamp', 'teddy'], 'wall': ['ribbon', 'clock'], 'pet': 'bunny'})

    def test_rejects_unknown_house_and_pet(self):
        self.assertIsNone(server.clean_home({'house': 'Castle'}))
        self.assertIsNone(server.clean_home('home'))
        self.assertIsNone(server.clean_home({'house': 'home', 'pet': 'dragon'})['pet'])

    def test_limits_floor_items(self):
        home = server.clean_home({'house': 'home', 'floor': ['lamp'] * 20})
        self.assertEqual(len(home['floor']), 6)


if __name__ == '__main__':
    unittest.main()
